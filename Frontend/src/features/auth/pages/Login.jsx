import React from 'react'
import "../auth.form.scss"
import {useNavigate,Link} from 'react-router'
const Login = () => {

    const handleSubmit =(e)=>{
        e.preventDefault();
    }

  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id='email' name='email' placeholder='Enter Email Address'/>
                </div>

                <div className="input-group">
                    <label htmlFor="password"Email>Password</label>
                    <input type="password" id='password' name='password' placeholder='Enter password'/>
                </div>

                <button className='button primary-button'> Login </button>


            </form>

            <p>Don't have an account? <Link to={"/register"}>Register</Link> </p>

        </div>
    </main>
  )
}

export default Login