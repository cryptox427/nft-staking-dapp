import { useEffect, useState } from "react";
import {StakingContract_Address, IPFS_URLs, NFTContract_Addresses} from "../../config";
import { ScaleLoader } from "react-spinners";
import { successAlert } from "./toastGroup";
import { Button, Grid } from "@mui/material";
import { PageLoading } from "./Loading";

export default function NFTCard({
    id,
    nftName,
    tokenId,
    signerAddress,
    updatePage,
    contract,
    contract_nft,
    collection,
    name
}) {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState("");
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

    const onStake = async () => {
        setLoading(true);
        try {
            const approved = await contract_nft.isApprovedForAll(signerAddress, StakingContract_Address);
            if (!approved) {
                const approve = await contract_nft.setApprovalForAll(StakingContract_Address, true)
                await approve.wait();
            }
            const stake = await contract.stake([collection], [tokenId])
            await stake.wait();
            successAlert("Staking is successful.")
            updatePage(signerAddress)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
        setLoading(false)
    }
    useEffect(() => {
        getNftDetail()
        // eslint-disable-next-line
    }, [])
    return (
        <div className="nft-card">
            <div className="reward">
                <p>{name}</p>
                <span>{tokenId.toString()}</span>
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
                <button className="btn-primary" onClick={onStake}>STAKE</button>
            </div>
        </div>
    )
}
//after
