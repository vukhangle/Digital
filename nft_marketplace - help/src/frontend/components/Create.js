import { useState } from 'react';
import { ethers } from 'ethers';
import { Row, Form, Button, Container } from 'react-bootstrap';
import axios from 'axios';
import "./App.css"

const pinataApiKey = '2b64c0a94f6ba3a6dac7';
const pinataSecretApiKey = 'f3098557c573688f1c176afb0bb0b929c0f2758db0bed831531baffcd466d531';

const uploadToPinata = async (file) => {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey,
    },
  };

  try {
    const response = await axios.post(url, formData, config);
    return response.data;
  } catch (error) {
    console.error("Pinata image upload error: ", error);
    throw error;
  }
};

const uploadMetadataToPinata = async (metadata) => {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey,
    },
  };

  try {
    const response = await axios.post(url, metadata, config);
    return response.data;
  } catch (error) {
    console.error("Pinata metadata upload error: ", error);
    throw error;
  }
};

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('');
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (file) {
      try {
        const result = await uploadToPinata(file);
        console.log(result);
        setImage(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
      } catch (error) {
        console.log("Pinata image upload error: ", error);
      }
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;
    try {
      const metadata = {
        image,
        price,
        name,
        description,
      };
      const result = await uploadMetadataToPinata(metadata);
      mintThenList(result);
    } catch (error) {
      console.log("Pinata metadata upload error: ", error);
    }
  };

  const mintThenList = async (result) => {
    const uri = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    try {
      // Mint NFT
      const mintTx = await nft.mint(uri);
      const mintReceipt = await mintTx.wait(); // Wait for the transaction to be mined
      
      // Log all events to find the Transfer event
      console.log("Transaction Receipt Events: ", mintReceipt.events);
      
      // Find the Transfer event and extract tokenId
      const transferEvent = mintReceipt.events.find(event => event.event === 'Transfer');
      if (!transferEvent || !transferEvent.args || transferEvent.args.length < 3) {
        throw new Error("Transfer event not found or incorrect event format");
      }
      const tokenId = transferEvent.args[2]; // Get the tokenId from Transfer event
      
      // Approve marketplace to spend NFT
      await (await nft.setApprovalForAll(marketplace.address, true)).wait();
      
      // Add NFT to marketplace
      const listingPrice = ethers.utils.parseEther(price.toString());
      await (await marketplace.makeItem(nft.address, tokenId, listingPrice)).wait();
    } catch (error) {
      console.log("Error minting or listing NFT: ", error);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <main role="main" className="col-lg-8 col-md-10 col-sm-12">
          <div className="p-4 bg-dark-blue text-light rounded shadow-sm">
            <h1 className="text-center mb-4">Create and List Your Asset</h1>
            <Form onSubmit={(e) => e.preventDefault()} className="d-grid gap-4">
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label className="text-light">Upload Image</Form.Label>
                <Form.Control type="file" required onChange={uploadToIPFS} />
              </Form.Group>
              <Form.Group controlId="formName">
                <Form.Label className="text-light">Name</Form.Label>
                <Form.Control
                  type="text"
                  size="lg"
                  placeholder="Enter name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="formDescription">
                <Form.Label className="text-light">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  size="lg"
                  placeholder="Enter description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="formPrice">
                <Form.Label className="text-light">Price (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  size="lg"
                  placeholder="Enter price in ETH"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Form.Group>
              <Button onClick={createNFT} variant="primary" size="lg">
                Create & List Asset
              </Button>
            </Form>
          </div>
        </main>
      </Row>
    </Container>
  );
}

export default Create;
