// src/components/Home.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Button, Container, Modal, Form, InputGroup } from 'react-bootstrap';
import './App.css';

const Home = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadMarketplaceItems = async () => {
    // Load all unsold items
    const itemCount = await marketplace.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i);
      if (!item.sold) {
        // get uri url from nft contract
        const uri = await nft.tokenURI(item.tokenId);
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(uri);
        const metadata = await response.json();
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(item.itemId);
        // Add item to items array
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image
        });
      }
    }
    setLoading(false);
    setItems(items);
    setFilteredItems(items); // Set initial filtered items
  };

  const filterItems = (query) => {
    const lowercasedQuery = query.toLowerCase();
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(lowercasedQuery) ||
      item.description.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredItems(filtered);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterItems(query);
  };

  const buyMarketItem = async (item) => {
    await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
    loadMarketplaceItems();
  };

  const handleShowModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  if (loading) return (
    <main className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <h2 className="text-light">Loading...</h2>
    </main>
  );

  return (
    <Container className="">
      <h1 className='mb-4'>DIGITAL ASSET DECENTRALIZED</h1>
      <div className="search-input-container">
        <InputGroup className='mb-4'>
          <Form.Control
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </InputGroup>
      </div>

      {filteredItems.length > 0 ?
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filteredItems.map((item, idx) => (
            <Col key={idx} className="d-flex align-items-stretch">
              <Card className="bg-dark-blue text-light border-light shadow-sm">
                <Card.Img
                  variant="top"
                  style={{ 
                    height: '200px', 
                    backgroundImage: `url(${item.image})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => handleShowModal(item)} // Show modal on image click
                />
                <Card.Body>
                  <Card.Title className="text-truncate" style={{ maxWidth: '150px' }}>{item.name}</Card.Title>
                  <Card.Text className="text-truncate" style={{ maxHeight: '60px', overflow: 'hidden' }}>
                    {item.description}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-dark-blue border-light">
                  <div className="d-grid">
                    <Button onClick={() => buyMarketItem(item)} variant="primary" size="sm">
                      Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
        : (
          <main className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <h2 className="text-light">No matching assets</h2>
          </main>
        )}

      {/* Modal for item details */}
      {selectedItem && (
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedItem.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img src={selectedItem.image} alt={selectedItem.name} className="img-fluid mb-3" />
            <p><strong>Description:</strong> {selectedItem.description}</p>
            <p><strong>Seller:</strong> {selectedItem.seller}</p>
            <p><strong>Price:</strong> {ethers.utils.formatEther(selectedItem.totalPrice)} ETH</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            <Button variant="primary" onClick={() => buyMarketItem(selectedItem)}>
              Buy for {ethers.utils.formatEther(selectedItem.totalPrice)} ETH
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default Home;
