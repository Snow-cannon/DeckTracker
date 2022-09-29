import * as React from 'react';
import { Dialog } from '@mui/material';
import { DialogTitle } from '@mui/material';
import { Button } from '@mui/material';
import { TextField } from '@mui/material';
import { DialogContent } from '@mui/material';
import { DialogActions } from '@mui/material';

export function LoginPopup(props) {
    return (
        <div>
      <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle textAlign={'center'}>Login</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
          />
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions style={{justifyContent: 'center'}}>
          <Button variant='contained' onClick={props.onClose}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
    )
}