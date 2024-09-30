import {
    Link
} from "react-router-dom";
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import digital from './digital.png'
import './App.css'

const Navigation = ({ web3Handler, account }) => {
    return (
        <Navbar expand="lg" variant="dark" className="py-3 shadow-lg bg-dark-blue">
            <Container>
                <Navbar.Brand className="d-flex align-items-center">
                    <img src={digital} width="50" height="50" className="d-inline-block align-top me-3 rounded-circle" alt="Market Logo" />
                    <span className="fs-3 fw-bold text-light">DIGITAL ASSET</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/" className="text-light fw-semibold nav-link">
                            Home
                        </Nav.Link>
                        <Nav.Link as={Link} to="/create" className="text-light fw-semibold nav-link">
                        Dashboard
                        </Nav.Link>
                        <Nav.Link as={Link} to="/my-listed-items" className="text-light fw-semibold nav-link">
                            Manage Asset
                        </Nav.Link>
                        <Nav.Link as={Link} to="/my-purchases" className="text-light fw-semibold nav-link">
                            History
                        </Nav.Link>
                    </Nav>
                    <Nav>
                        {account ? (
                            <Nav.Link
                                href={`https://etherscan.io/address/${account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-light d-flex align-items-center">
                                <Button variant="outline-light" className="rounded-pill">
                                    {account.slice(0, 6) + '...' + account.slice(-4)}
                                </Button>
                            </Nav.Link>
                        ) : (
                            <Button onClick={web3Handler} variant="outline-light" className="rounded-pill">
                                Connect Wallet
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Navigation;
