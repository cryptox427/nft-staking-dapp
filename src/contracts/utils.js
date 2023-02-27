import WalletConnectProvider from "@walletconnect/web3-provider"

export const INFURA_ID = "a92faac6e14345c0863377643370c015"

export const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
            infuraId: INFURA_ID, // required,
            rpc: {
                25: 'https://evm.cronos.org/'
            }
        },
    },
}
