//import logo from './logo.svg';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import BootStrapNav from "./Components/BootStrapNav";
import Footer from "./Components/Footer";
import FitnessPage from './Pages/FitnessPage';

import "./CSS/footer.css"
import {Route, Routes} from "react-router-dom"
import Profile from "./Pages/Profile";
import Welcome from "./Pages/Welcome";
import RequireAuth from "./features/auth/RequireAuth";
import LoginSignup from "./Pages/LoginSignup";
import Layout from "./Pages/Layout";
import PersistLogin from "./features/auth/PersistLogin";

function App() {
  return (
    <div className="App">
      <BootStrapNav />
      <Routes>

          <Route path="/" element={<Layout/>}>
            <Route index element={<LoginSignup/>}/>
            <Route path="login" element={<LoginSignup />} />

          <Route element={<PersistLogin/>}>
            <Route element={<RequireAuth />}>
            {/* protected routes */}
              <Route path="/FitnessPage" element={<FitnessPage/>}/>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/profile" element={<Profile/>}/>
            </Route>
          </Route>
          {/*Index.js holds more info about routing*/}
          </Route>
      </Routes>
      <Footer/>
    </div>
  );
}

export default App;
