import { useEffect, useState } from "react";
import { successAlert } from "./toastGroup";
import { PageLoading } from "./Loading";
import {StakingContract_Address, IPFS_URLs, NFTContract_Addresses} from "../../config";

export default function UnNFTCard({
    id,
    nftName,
    tokenId,
    signerAddress,
    updatePage,
    contract,
    contract_nft,
    stakingId,
    collection
}) {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState("");
    const [reward, setReward] = useState(0);

    const getNftDetail = async () => {
        switch (collection) {
            case NFTContract_Addresses[0]:
                setImage(`${IPFS_URLs[0]}/${tokenId}.png`);
                break;
            case NFTContract_Addresses[1]:
                setImage(IPFS_URLs[1]);
                break;
            case NFTContract_Addresses[2]:
                setImage(`${IPFS_URLs[2]}/${tokenId}.gif`)
        }
    }

    const getReward = async () => {
        const _reward = parseFloat((await contract.getReward(stakingId)) / Math.pow(10, 9)).toFixed(4);
        setReward(_reward);
    }

    const onUnStake = async () => {
        setLoading(true);
        try {
            const unstake = await contract.unStake([stakingId])
            await unstake.wait();
            successAlert("Unstaking is successful.")
            updatePage(signerAddress)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
        setLoading(false)
    }

    const onClaim = async () => {
        setLoading(true);
        try {
            const claim = await contract.claimReward([stakingId])
            await claim.wait();
            successAlert("Claiming is successful.")
            getReward();
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        getNftDetail();
        getReward();
        let interval = setInterval(() => {
            getReward();
        }, 10000);
        return () => {
            clearInterval(interval)
        }
        // eslint-disable-next-line
    }, [])
    return (
        <div className="nft-card">
            <div className="reward">
                <p>Reward:</p>
                <span>{reward} FAFO</span>
            </div>
            {loading &&
                <div className="card-loading">
                    <PageLoading />
                </div>
            }
            <div className="media">
                {image === "" || image === undefined?
                    <img src="./undefined.png" alt={"undefined"}/>
                    :
                    // eslint-disable-next-line
                    <img
                        src={image}
                        alt=""
                        style={{ opacity: loading ? 0 : 1 }}
                    />
                }
            </div>
            <div className={loading ? "card-action is-loading" : "card-action"}>
                <button className="btn-primary" onClick={onUnStake}>UNSTAKE</button>
                <button className="btn-primary" onClick={onClaim}>CLAIM</button>
            </div>
        </div>
    )
}
//after
