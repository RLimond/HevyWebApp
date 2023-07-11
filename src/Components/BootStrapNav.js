import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from "react-router-dom"
import { useSendLogoutMutation } from '../features/auth/authApiSlice';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState} from 'react';
function BootStrapNav() {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate()
    const [sendLogout, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useSendLogoutMutation()

    useEffect(() => {
        if (isSuccess) navigate('/')
    }, [isSuccess, navigate])


    if (isLoading) return <p>Logging Out...</p>

    if (isError) return <p>Error: {error.data?.message}</p>

    const handleNavbarToggle = () => {
      setExpanded(!expanded);
    };
  
    return (
      <>
        <Navbar bg="dark" variant="dark" expand="sm" expanded={expanded} className="pl-3">
          <Container fluid className="pl-3">
            <Navbar.Brand href="/">Home</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbar-nav" onClick={handleNavbarToggle} />
            <Navbar.Collapse id="navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/FitnessPage" className="mx-3">Fitness Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/profile" className="mx-3">Profile</Nav.Link>
              </Nav>
              <Nav className="ml-auto">
                <Nav.Link onClick={sendLogout} className="mx-3">Logout</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </>
    );
}

export default BootStrapNav;