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
    StakingContract_ABI,
    StakingContract_Address
} from "../../config"
import NFTCard from "../components/NFTCard";
import {errorAlertCenter, successAlert} from "../components/toastGroup";
import {Container, Grid} from "@mui/material";
import UnNFTCard from "../components/UnNFTCard";
import {PageLoading} from "../components/Loading";

let web3Modal = undefined;
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
            let name = await nftContracts[NFTContract_Addresses[i]].name();
            for (let j = 0; j < tokens; j++) {
                let tokenId = await nftContracts[NFTContract_Addresses[i]].tokenOfOwnerByIndex(address, j)
                unstaked.push({id, collection: NFTContract_Addresses[i], tokenId, name});
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
                                            {/*<div className="box-control">*/}
                                            {/*    <button className="btn-second" onClick={() => {}} disabled={stakeAllLoading}>*/}
                                            {/*        {stakeAllLoading ?*/}
                                            {/*            <div className="btn-loading">*/}
                                            {/*                <PageLoading />*/}
                                            {/*            </div>*/}
                                            {/*            :*/}
                                            {/*            <>STAKE ALL</>*/}
                                            {/*        }*/}
                                            {/*    </button>*/}
                                            {/*</div>*/}
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
                                                            name = {item.name}
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
                                            {/*<div className="box-control">*/}
                                            {/*    <button className="btn-second" onClick={() => {}} disabled={unstakeAllLoading}>*/}
                                            {/*        {unstakeAllLoading ?*/}
                                            {/*            <div className="btn-loading">*/}
                                            {/*                <PageLoading />*/}
                                            {/*            </div>*/}
                                            {/*            :*/}
                                            {/*            <>UNSTAKE ALL</>*/}
                                            {/*        }*/}
                                            {/*    </button>*/}
                                            {/*    <button className="btn-second" onClick={() => {}} disabled={claimAllLoading}>*/}
                                            {/*        {claimAllLoading ?*/}
                                            {/*            <div className="btn-loading">*/}
                                            {/*                <PageLoading />*/}
                                            {/*            </div>*/}
                                            {/*            :*/}
                                            {/*            <>CLAIM ALL</>*/}
                                            {/*        }*/}
                                            {/*    </button>*/}
                                            {/*</div>*/}
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
