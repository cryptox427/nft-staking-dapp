import React, {useEffect, useState} from "react";
import Head from "next/head"
import Header from "../components/Header";
import styles from "../styles/Home.module.css";
import Web3 from "web3"
import Web3Modal from "web3modal"
import {ethers, providers} from "ethers"
import {providerOptions} from "../contracts/utils"
import {
    CHAIN_ID,
    NETWORK,
    NFTContract_ABIs,
    NFTContract_Addresses,
    SITE_ERROR,
    SMARCONTRACT_INI_ABI,
    StakingContract_ABI,
    StakingContract_Address,
    StakingContract_Address_NFT
} from "../../config"
import NFTCard from "../components/NFTCard";
import {errorAlertCenter, successAlert} from "../components/toastGroup";
import {Container, Grid} from "@mui/material";
import UnNFTCard from "../components/UnNFTCard";
import {PageLoading} from "../components/Loading";

let web3Modal = undefined;
let contract = undefined;
let contract_20 = undefined;
let contract_nft = undefined;
let contract_staking = undefined;
let nftContracts = {};

export default function Home() {
    const [connected, setConnected] = useState(false);
    const [signerAddress, setSignerAddress] = useState("");
    const [unstakedNFTs, setUnstakedNFTs] = useState();
    const [stakedNFTs, setStakedNFTs] = useState();
    const [loading, setLoading] = useState(false);
    const [totalStaked, setTotalStaked] = useState(0);
    const [stakeAllLoading, setStakeAllLoading] = useState(false);
    const [unstakeAllLoading, setUnstakeAllLoading] = useState(false);
    const [claimAllLoading, setClaimAllLoading] = useState(false);
    const [dailyRewardRate, setDailyRewardRate] = useState(0);

    const connectWallet = async () => {
        if (await checkNetwork()) {
            setLoading(true)
            web3Modal = new Web3Modal({
                network: NETWORK, // optional
                cacheProvider: true,
                providerOptions, // required
            })
            try {
                const provider = await web3Modal.connect();
                const web3Provider = new providers.Web3Provider(provider);
                const signer = web3Provider.getSigner();
                const address = await signer.getAddress();

                setConnected(true);
                setSignerAddress(address);

                contract = new ethers.Contract(
                    StakingContract_Address,
                    StakingContract_ABI,
                    signer
                );

                contract_nft = new ethers.Contract(
                    StakingContract_Address_NFT,
                    SMARCONTRACT_INI_ABI,
                    signer
                );

                contract_staking = new ethers.Contract(
                    StakingContract_Address,
                    StakingContract_ABI,
                    signer
                );

                for (let i = 0; i < NFTContract_Addresses.length; i++) {
                    nftContracts[NFTContract_Addresses[i]] = new ethers.Contract(
                        NFTContract_Addresses[i],
                        NFTContract_ABIs[i],
                        signer
                    );
                }


                // contract_20 = new ethers.Contract(
                //     SMARTCONTRACT_ADDRESS_ERC20,
                //     SMARTCONTRACT_ABI_ERC20,
                //     signer
                // );
                // setDailyRewardRate((await contract.rate()) / Math.pow(10, 18) / 25)

                /////////////////
                updatePage(address);
                /////////////////

                // Subscribe to accounts change
                provider.on("accountsChanged", (accounts) => {
                    console.log(accounts[0], '--------------');
                });
            } catch (error) {
                console.log(error)
            }
        }
    }

    const updatePage = async (address) => {
        setLoading(true)
        let unstaked = [], staked = [];
        for (let i = 0; i < NFTContract_Addresses.length; i++) {
            let tokens = await nftContracts[NFTContract_Addresses[i]].balanceOf(address);
            let id = unstaked.length;
            for (let j = 0; j < tokens; j++) {
                let tokenId = await nftContracts[NFTContract_Addresses[i]].tokenOfOwnerByIndex(address, j)
                unstaked.push({id, collection: NFTContract_Addresses[i], tokenId});
            }
        }
        let balance = await contract_staking.balances(address);
        for (let i = 0; i < balance; i++) {
            let stakingId = await contract_staking.stakingOfOwnerByIndex(address, i);
            let stakingInfo = await contract_staking.stakingById(stakingId);
            let id = staked.length;
            staked.push({id, collection: stakingInfo[1], tokenId: parseInt(stakingInfo[2].toString()), stakingId})
        }
        let totalStakings = await contract_staking.getTotalStakings();
        setUnstakedNFTs(unstaked);
        setStakedNFTs(staked);
        setTotalStaked(totalStakings.toString())
        setLoading(false);
    }

    const checkNetwork = async () => {
        const web3 = new Web3(Web3.givenProvider)
        const chainId = await web3.eth.getChainId()
        if (chainId === CHAIN_ID) {
            return true
        } else {
            errorAlertCenter(SITE_ERROR[0])
            return false
        }
    }

    const onStakeAll = async () => {
        setStakeAllLoading(true);
        let unstaked = [];
        for (let item of unstakedNFTs) {
            unstaked.push(item.id);
        }
        try {
            const approved = await contract_nft.isApprovedForAll(signerAddress, StakingContract_Address);
            console.log(approved, "approved")
            if (!approved) {
                const approve = await contract_nft.setApprovalForAll(StakingContract_Address, true)
                await approve.wait();
            }
        console.log('-------', StakingContract_Address_NFT, unstaked[0])
            const stake = await contract.callStakeToken(StakingContract_Address_NFT, 100)
            await stake.wait();
            successAlert("Staking is successful.")
            updatePage(signerAddress)
        } catch (error) {
            setStakeAllLoading(false)
            console.log(error)
        }
        setStakeAllLoading(false);
    }

    const onUnstakeAll = async () => {
        setUnstakeAllLoading(true);
        let staked = [];
        for (let item of stakedNFTs) {
            staked.push(item.id);
        }
        try {
            const unstake = await contract.cancelStake(staked[0]);
            await unstake.wait();
            successAlert("Unstaking is successful.");
            updatePage(signerAddress);
        } catch (error) {
            setUnstakeAllLoading(false);
            console.log(error);
        }
        setUnstakeAllLoading(false)
    }

    const onClaimAll = async () => {
        setClaimAllLoading(true);
        let staked = [];
        for (let item of stakedNFTs) {
            staked.push(item.id);
        }
        try {
            const unstake = await contract.claimReward(staked)
            await unstake.wait();
            successAlert("Claiming is successful.")
            updatePage(signerAddress)
        } catch (error) {
            setClaimAllLoading(false)
            console.log(error)
        }
        setClaimAllLoading(false)
    }

    useEffect(() => {
        async function fetchData() {
            if (typeof window.ethereum !== 'undefined') {
                if (await checkNetwork()) {
                    await connectWallet();
                    ethereum.on('accountsChanged', function (accounts) {
                        window.location.reload();
                    });
                    if (ethereum.selectedAddress !== null) {
                        setSignerAddress(ethereum.selectedAddress);
                        setConnected(true);
                    }
                    ethereum.on('chainChanged', (chainId) => {
                        checkNetwork();
                    })
                }
            } else {
                errorAlertCenter(SITE_ERROR[1])
            }
        }
        fetchData()
        // eslint-disable-next-line
    }, [])

    return (
        <>
            <Head>
                <title>NFT Staking Pool</title>
                <meta name="description" content="NFT Staking Pool" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={styles.main}>
                <Header
                    signerAddress={signerAddress}
                    connectWallet={() => connectWallet()}
                    connected={connected}
                />
                <div className="top-title">
                    <Container maxWidth="lg">
                        <h1 className="title">
                            Stake Your NFT
                        </h1>
                        {/*<p className="reward-rate">daily reward rate: <span>{dailyRewardRate === 0 ? "--" : dailyRewardRate} MTK</span></p>*/}
                    </Container>
                </div>
                {connected &&
                    <Container>
                        <div className="main-page">
                            <div className="title-bar">
                                <h2>Total staked NFT: {totalStaked}</h2>
                            </div>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <div className="nft-box">
                                        <div className="box-header">
                                            <h3>Your NFT {unstakedNFTs?.length && `(${unstakedNFTs?.length})`}</h3>
                                            <div className="box-control">
                                                <button className="btn-second" onClick={onStakeAll} disabled={stakeAllLoading}>
                                                    {stakeAllLoading ?
                                                        <div className="btn-loading">
                                                            <PageLoading />
                                                        </div>
                                                        :
                                                        <>STAKE ALL</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                        <div className="box">
                                            {loading ?
                                                <PageLoading />
                                                :
                                                <div className="box-content">
                                                    {unstakedNFTs && unstakedNFTs.length !== 0 && unstakedNFTs.map((item, key) => (
                                                        <NFTCard
                                                            id={item.id}
                                                            key={key}
                                                            tokenId={item.tokenId}
                                                            signerAddress={signerAddress}
                                                            updatePage={() => updatePage(signerAddress)}
                                                            contract={contract_staking}
                                                            contract_nft={nftContracts[item.collection]}
                                                            collection = {item.collection}
                                                        />
                                                    ))}
                                                </div>

                                            }
                                        </div>
                                    </div>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <div className="nft-box">
                                        <div className="box-header">
                                            <h3>Staked NFT {stakedNFTs?.length && `(${stakedNFTs?.length})`}</h3>
                                            <div className="box-control">
                                                <button className="btn-second" onClick={onUnstakeAll} disabled={unstakeAllLoading}>
                                                    {unstakeAllLoading ?
                                                        <div className="btn-loading">
                                                            <PageLoading />
                                                        </div>
                                                        :
                                                        <>UNSTAKE ALL</>
                                                    }
                                                </button>
                                                <button className="btn-second" onClick={onClaimAll} disabled={claimAllLoading}>
                                                    {claimAllLoading ?
                                                        <div className="btn-loading">
                                                            <PageLoading />
                                                        </div>
                                                        :
                                                        <>CLAIM ALL</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                        <div className="box">
                                            {loading ?
                                                <PageLoading />
                                                :
                                                <div className="box-content">
                                                    {stakedNFTs && stakedNFTs.length !== 0 && stakedNFTs.map((item, key) => (
                                                        <UnNFTCard
                                                            key={key}
                                                            id={item.id}
                                                            tokenId={item.tokenId}
                                                            signerAddress={signerAddress}
                                                            updatePage={() => updatePage(signerAddress)}
                                                            contract={contract_staking}
                                                            contract_nft={nftContracts[item.collection]}
                                                            stakingId = {item.stakingId}
                                                        />
                                                    ))}
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </Grid>
                            </Grid>
                        </div>
                    </Container>
                }
            </main>
            {/* eslint-disable-next-line */}
            <img
                src="/kongbackground.gif"
                className="background"
                alt=""
            />
        </>
    )
}
