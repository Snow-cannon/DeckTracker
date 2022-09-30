import * as React from 'react';
import { Dialog } from '@mui/material';
import { DialogTitle } from '@mui/material';
import { Button } from '@mui/material';
import { TextField } from '@mui/material';
import { DialogContent } from '@mui/material';
import { DialogActions } from '@mui/material';

export function SignupPopup(props) {
    async function handleSignup(email, password) {
        console.log(email, password);
        let res = await fetch('/api/users/newUser', {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({'email': email, 'password': password})});
        if (res.status === 201) {
            props.setUserState(email)
            props.onClose();
        }
        else {
            window.alert('User failed to be created');
        }
    }
    return (
        <div>
            <Dialog open={props.open} onClose={props.onClose}>
                <DialogTitle textAlign={'center'}>Sign Up</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="standard"
                    />
                </DialogContent>
                <DialogActions style={{ justifyContent: 'center' }}>
                    <Button variant='contained' onClick={(e) => handleSignup(document.getElementById('email').value, document.getElementById('password').value)}>Sign Up</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}