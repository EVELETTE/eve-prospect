// src/components/Auth.js
import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';

const Auth = () => {
    const [auth, setAuth] = useState(false); // Pour vérifier si l'utilisateur est connecté

    return (
        <div>
            {auth ? (
                <p>Vous êtes connecté !</p>
            ) : (
                <>
                    <Login setAuth={setAuth} />
                    <Register />
                </>
            )}
        </div>
    );
};

export default Auth;
