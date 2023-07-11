import React, { useState } from 'react';
import { baseQueryWithReauth } from "../app/api/apiSlice"
import { store } from "../app/store"
import "../CSS/updateUser.css"

// api parameter for baseQueryWithReauth
const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}
export default function UpdateUser(){
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false)

    async function updateUser(e) {
        try {
          e.preventDefault()
          setLoading(true); // Set loading to true before making the request
          const response = await baseQueryWithReauth({url :'/users/update', method: 'POST', body: {password: password}}, baseQueryOptions, {});
          setLoading(false); // Set loading to false after the request is complete
          window.location.reload();
        } catch (error) {
          setLoading(false); // Set loading to false in case of an error
          console.error(error);
        }
        setPassword('');
      }

      return (
        <div className="update-form-container">
        <form className='update-form' onSubmit={updateUser}>
            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
            />
            <div className='update-form-btn-container'>
                <button className="update-button">
                    <p>{loading ? 'Loading...' : 'Update'}</p>
                </button>
            </div>
        </form>
    </div>
      )
}