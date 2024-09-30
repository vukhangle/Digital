import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { Row, Col, Card, Modal, Button } from 'react-bootstrap';
import './App.css';

export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [totalSpentWeek, setTotalSpentWeek] = useState(0);
  const [totalSpentMonth, setTotalSpentMonth] = useState(0);
  const [totalSpentYear, setTotalSpentYear] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadPurchasedItems = async () => {
    try {
      const filter = marketplace.filters.Bought(null, null, null, null, null, account);
      const results = await marketplace.queryFilter(filter);
      console.log('Query Results:', results);

      if (results.length === 0) {
        console.log('No purchase events found.');
        setLoading(false);
        return;
      }

      const purchases = await Promise.all(results.map(async i => {
        i = i.args;
        console.log('Event Args:', i);
        
        const uri = await nft.tokenURI(i.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        console.log('Metadata URI:', uri);
        console.log('Metadata:', metadata);

        const totalPrice = await marketplace.getTotalPrice(i.itemId);
        let purchasedItem = {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          seller: i.seller,
          purchaseDate: i.timestamp ? new Date(i.timestamp.toNumber() * 1000) : new Date() // Default to now if timestamp is missing
        };
        console.log('Purchased Item:', purchasedItem);
        return purchasedItem;
      }));

      const now = new Date();
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const totalSpentWeek = purchases
        .filter(item => item.purchaseDate >= weekAgo)
        .reduce((acc, item) => acc + parseFloat(ethers.utils.formatEther(item.totalPrice)), 0);

      const totalSpentMonth = purchases
        .filter(item => item.purchaseDate >= monthAgo)
        .reduce((acc, item) => acc + parseFloat(ethers.utils.formatEther(item.totalPrice)), 0);

      const totalSpentYear = purchases
        .filter(item => item.purchaseDate >= yearAgo)
        .reduce((acc, item) => acc + parseFloat(ethers.utils.formatEther(item.totalPrice)), 0);

      setLoading(false);
      setPurchases(purchases);
      setTotalSpentWeek(totalSpentWeek);
      setTotalSpentMonth(totalSpentMonth);
      setTotalSpentYear(totalSpentYear);
    } catch (error) {
      console.error("Error loading purchased items: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchasedItems();
  }, []);

  const handleShowModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (loading) return (
    <main className="my-purchases-loading-container">
      <h2>Loading...</h2>
    </main>
  );

  return (
    <div className="my-purchases-container">
      <div className="px-5 container">
        <h3 className="my-purchases-title">Total ETH Spent</h3>
        <p><strong>Bought:</strong> {purchases.length} Asset</p>
        <p><strong>This Week:</strong> {totalSpentWeek.toFixed(4)} ETH</p>
        <p><strong>This Month:</strong> {totalSpentMonth.toFixed(4)} ETH</p>
        <p><strong>This Year:</strong> {totalSpentYear.toFixed(4)} ETH</p>

        {purchases.length > 0 ?
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card className="my-purchases-card" onClick={() => handleShowModal(item)}>
                  <Card.Img variant="top" src={item.image} className="my-purchases-card-img" />
                  <Card.Footer className="my-purchases-card-footer">
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
          : (
            <main style={{ padding: "1rem 0" }}>
              <h2>No purchases</h2>
            </main>
          )}
        {selectedItem && (
          <Modal show={showModal} onHide={handleCloseModal} className="my-purchases-modal-content">
            <Modal.Header closeButton className="my-purchases-modal-header">
              <Modal.Title className="my-purchases-modal-title">{selectedItem.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="my-purchases-modal-body">
              <img src={selectedItem.image} alt={selectedItem.name} className="img-fluid mb-3" />
              <p><strong>Description:</strong> {selectedItem.description}</p>
              <p><strong>Price:</strong> {ethers.utils.formatEther(selectedItem.totalPrice)} ETH</p>
              <p><strong>Sold To:</strong> {selectedItem.seller}</p>
            </Modal.Body>
            <Modal.Footer className="my-purchases-modal-footer">
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
}
