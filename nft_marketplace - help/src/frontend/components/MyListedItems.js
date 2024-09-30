import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card, Container, Modal, Button } from 'react-bootstrap';
import './App.css';

function renderSoldItems(items, handleShowDetails) {
  return (
    <Container className="my-5">
      <h2 className="my-listed-items-title">- Sold -</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item, idx) => (
          <Col key={idx} className="overflow-hidden">
            <Card className="my-listed-items-card" onClick={() => handleShowDetails(item)}>
              <Card.Img variant="top" src={item.image} className="my-listed-items-card-img" />
              <Card.Footer className="my-listed-items-card-footer">
                For {ethers.utils.formatEther(item.totalPrice)} ETH - Received {ethers.utils.formatEther(item.price)} ETH
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [revenue, setRevenue] = useState('0');

  const loadListedItems = async () => {
    const itemCount = await marketplace.itemCount();
    let listedItems = [];
    let soldItems = [];
    let totalRevenue = ethers.BigNumber.from(0);

    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx);
      if (i.seller.toLowerCase() === account) {
        const uri = await nft.tokenURI(i.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketplace.getTotalPrice(i.itemId);
        let item = {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          seller: i.seller,
          sold: i.sold
        };
        listedItems.push(item);
        if (i.sold) {
          soldItems.push(item);
          totalRevenue = totalRevenue.add(i.price);
        }
      }
    }
    setLoading(false);
    setListedItems(listedItems);
    setSoldItems(soldItems);
    setRevenue(ethers.utils.formatEther(totalRevenue));
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  const handleShowDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  if (loading) return (
    <main className="my-listed-items-loading-container">
      <h2>Loading...</h2>
    </main>
  );

  return (
    <Container className="my-listed-items-container">
      <h2 className="my-listed-items-title">Total Revenue: {revenue} ETH</h2>
      {listedItems.length > 0 ?
        <div className="px-5 py-3">
          <h2 className="my-listed-items-title">- Listed -</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className="my-listed-items-card" onClick={() => handleShowDetails(item)}>
                  <Card.Img variant="top" src={item.image} className="my-listed-items-card-img" />
                  <Card.Footer className="my-listed-items-card-footer">
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
          {soldItems.length > 0 && renderSoldItems(soldItems, handleShowDetails)}
        </div>
        : (
          <main className="my-listed-items-loading-container">
            <h2>No listed assets</h2>
          </main>
        )}

      {/* Modal for item details */}
      {selectedItem && (
        <Modal show={showModal} onHide={handleClose} centered className="my-listed-items-modal-content">
          <Modal.Header closeButton className="my-listed-items-modal-header">
            <Modal.Title className="my-listed-items-modal-title">{selectedItem.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="my-listed-items-modal-body">
            <img src={selectedItem.image} alt={selectedItem.name} className="img-fluid mb-3" />
            <p><strong>Description:</strong> {selectedItem.description}</p>
            <p><strong>Price:</strong> {ethers.utils.formatEther(selectedItem.price)} ETH</p>
            <p><strong>Total Price:</strong> {ethers.utils.formatEther(selectedItem.totalPrice)} ETH</p>
          </Modal.Body>
          <Modal.Footer className="my-listed-items-modal-footer">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}
