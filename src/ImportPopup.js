import * as React from 'react';
import { Dialog } from '@mui/material';
import { DialogTitle } from '@mui/material';
import { Button } from '@mui/material';
import { TextField } from '@mui/material';
import { DialogContent } from '@mui/material';
import { DialogActions } from '@mui/material';

export function ImportPopup(props) {
    async function handleImport(deckName, deckContent) {
        console.log(deckName, deckContent);
        let res = await fetch('/api/users/decks', {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({'deckName': deckName, 'deckContent': deckContent})});
        if (res.status === 201) {
            props.onClose();
        }
        else {
            window.alert('Deck failed to import');
        }
    }
    return (
        <div>
            <Dialog open={props.open} onClose={props.onClose}>
                <DialogTitle textAlign={'center'}>Import a new deck</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="deckName"
                        label="Deck Name"
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="deckContent"
                        label="Deck Content"
                        multiline
                        maxRows={8}
                        variant="standard"
                    />
                </DialogContent>
                <DialogActions style={{ justifyContent: 'center' }}>
                    <Button variant='contained' onClick={(e) => handleImport(document.getElementById('deckName').value, document.getElementById('deckContent').value)}>Import</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}