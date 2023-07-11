import { useSelector } from "react-redux"
import { selectCurrentUser } from "../features/auth/authSlice"
import { Link } from "react-router-dom"
import '../CSS/pages/welcome.css'
const Welcome = () => {
    const user = useSelector(selectCurrentUser)
    const welcome = user ? `Welcome ${user}!` : 'Welcome!'

    const content = (
        <section className="welcome">
            <div className="site-info">
            <div className="welcome-header">
            <h1>{welcome}</h1>
            <Link to="/profile" className="default-button display-md-vp" style={{textDecoration:'none', padding:'3px', marginRight:'8px'}}>Go to your profile</Link>
            <Link to="/FitnessPage" className="default-button display-md-vp" style={{textDecoration:'none', padding:'3px'}}>Go to the dashboard</Link>
            </div>
            </div>
            <div className="site-info">
                <div className="box">
                    <h3> About This Site</h3>
                    <p>Add friends and explore your workout data together! You have access to the workout data of yourself and the users you follow, and they have access to your data if you allow them to follow you.
                    You can change your profile privacy at any time in order to toggle whether or not a user must await your approval before they can follow you. Additionally, you can choose to
                    remove a follower at any time if you wish. Navigate to your profile page in order to handle incomming/outgoing follow requests, removing followers/following, and deleting your profile.
                    </p>
                </div>
                <div className="box-sm">
                    <h3> Note!</h3>
                    <p>
                    Your workout data will not automatically update. The data is fetched from Hevy and must be updated every time you want to see your new workouts.
                    This can be done by entering your password (for Hevy, not this site) and clicking update in your profile page.
                    </p>
                </div>
                <div className="box-md">
                 <h3> About the Dashboard</h3>
                <p>
                The dashboard will allow you to view all of your (or the users you follow) workouts and certain statistics. Select the user whose data you want to see using the 
                dropdown at the top. The search-workout search bar will allow you to see your progress on that lift over the selected timeframe (months).
                Enter the name of a workout, such as 'bench press (smith machine)', to see the results.
                You can also choose from a list of queries to search the data.
                </p>
            </div>
            </div>
            <div style={{textAlign:'center'}}>
            <Link to="/profile" className="default-button hidden-md-vp" style={{textDecoration:'none', padding:'3px', marginRight:'8px'}}>Go to your profile</Link>
            <Link to="/FitnessPage" className="default-button hidden-md-vp" style={{textDecoration:'none', padding:'3px'}}>Go to the dashboard</Link>
            </div>

        </section>
    )

    return content
}
export default Welcome