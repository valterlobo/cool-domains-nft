import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
// At the very top of the file, after the other imports
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';


// Constants
const TWITTER_HANDLE = "valterlobo1";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// Add the domain you will be minting
const tld = ".wolf";
const CONTRACT_ADDRESS = "0xB101D17785F2A9257bD413f95a3c0881A56364EF";

const App = () => {
	const [currentAccount, setCurrentAccount] = useState("");
	// Create a stateful variable to store the network next to all the others
	const [network, setNetwork] = useState('');
	// Add some state data propertie
	const [domain, setDomain] = useState("");
	const [record, setRecord] = useState("");
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);


	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have metamask!");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		const accounts = await ethereum.request({ method: "eth_accounts" });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log("Found an authorized account:", account);
			setCurrentAccount(account);
		} else {
			console.log("No authorized account found");
		}

		//
		// This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);

		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) {
			return;
		}
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert("Domain must be at least 3 characters long");
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price =
			domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
		console.log("Minting domain", domain, "with price", price);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				console.log("Going to pop wallet now to pay gas...");
				let tx = await contract.register(domain, {
					value: ethers.utils.parseEther(price),
				});
				// Wait for the transaction to be mined
				const receipt = await tx.wait();

				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log(
						"Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
					);

					// Set the record for the domain
					tx = await contract.setRecord(domain, record);
					await tx.wait();

					console.log(
						"Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
					);

					// Call fetchMints after 2 seconds
					setTimeout(() => {
						fetchMints();
					}, 2000);

					setRecord("");
					setDomain("");
				} else {
					alert("Transaction failed! Please try again");
				}
			}
		} catch (error) {
			console.log(error);
		}
	};

	// Render methods
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://i.imgur.com/JzlLtkX.gif" alt="wolf gif" />
			{/* Call the connectWallet function we just wrote when the button is clicked */}
			<button
				onClick={connectWallet}
				className="cta-button connect-wallet-button"
			>
				Connect Wallet
			</button>
		</div>
	);

	// Form to enter domain name and data
	const renderInputForm = () => {

		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<p>Please connect to the Polygon Mumbai Testnet</p>
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}

		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder="domain"
						onChange={(e) => setDomain(e.target.value)}
					/>
					<p className="tld"> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder="whats ur wolf power?"
					onChange={(e) => setRecord(e.target.value)}
				/>

				<div className="button-container">

					<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
						Set record
					</button>
					{/* Call the mintDomain function when the button is clicked*/}
					<button className="cta-button mint-button" disabled={loading} onClick={mintDomain}>
						Mint
					</button>
				</div>
			</div>
		);
	};

	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
				});
			} catch (error) {
				// This error code means that the chain we want has not been added to MetaMask
				// In this case we ask the user to add it to their MetaMask
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18
									},
									blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If window.ethereum is not found then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		}
	}

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

				fetchMints();
				setRecord('');
				setDomain('');
			}
		} catch (error) {
			console.log(error);
		}
		setLoading(false);
	}

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	// Add a stateful array at the top next to all the other useState calls
	const [mints, setMints] = useState([]);

	// Add this function anywhere in your component (maybe after the mint function)
	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				// You know all this
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				// Get all the domain names from our contract
				const names = await contract.getAllNames();

				// For each name, get the record and the address
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);
					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner,
					};
				}));

				console.log("MINTS FETCHED ", mintRecords);
				setMints(mintRecords);
			}
		} catch (error) {
			console.log(error);
		}
	}

	// This will run any time currentAccount or network are changed
	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}
	}, [currentAccount, network]);


	// Add this render function next to your other render functions
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle"> Recently minted domains!</p>
					<div className="mint-list">
						{mints.map((mint, index) => {
							return (
								<div className="mint-item" key={index}>
									<div className='mint-row'>
										<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
											<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
										</a>
										{/* If mint.owner is currentAccount, add an "edit" button*/}
										{mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
											<button className="edit-button" onClick={() => editRecord(mint.name)}>
												<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
											</button>
											:
											null
										}
									</div>
									<p> {mint.record} </p>
								</div>)
						})}
					</div>
				</div>);
		}
	};

	// This will take us into edit mode and show us the edit buttons!
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
							<p className="title"> 🐺 Wolf Name Service</p>
							<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
						{/* Display a logo and wallet connection status*/}
						<div className="right">
							<img
								alt="Network logo"
								className="logo"
								src={network.includes("Polygon") ? polygonLogo : ethLogo}
							/>
							{currentAccount ? (
								<p>
									{" "}
									Wallet: {currentAccount.slice(0, 6)}...
									{currentAccount.slice(-4)}{" "}
								</p>
							) : (
								<p> Not connected </p>
							)}
						</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}

				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
					<hr></hr>
					<a
						className="footer-text"
						href="https://buildspace.so/p/build-polygon-ens"
						target="_blank"
						rel="noreferrer"
					>Build your own domain service on a Polygon L2 in a weekend</a>
					
					

				</div>
			</div>
		</div>
	);
};

export default App;