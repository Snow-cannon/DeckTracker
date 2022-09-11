// import logo from './logo.svg';
import './App.css';
import { Checkbox } from '@mui/material';
import { FormGroup } from '@mui/material';
import { FormControlLabel } from '@mui/material';
import * as React from 'react';
import { Accordion } from '@mui/material';
import { AccordionSummary } from '@mui/material';
import { AccordionDetails } from '@mui/material';
import { Typography } from'@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Drawer } from '@mui/material';
import { Button } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';

function App(props) {
  const [state, setState] = React.useState({
    drawerOpen: false,
  });

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, drawerOpen: open });
  };

  let rows = [];
  let index = 0;
  for(const option in props.filterOptions){
    rows.push(
      <Accordion key={index}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>{option}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {props.filterOptions[option].map(function(choice, i){return <FormControlLabel control={<Checkbox />} label={choice} key={i}/>})}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    );
    index++;
  }
  return (
    <div>
      <div id="bx">
        <div className="b">
          <Button variant="contained" endIcon={<FilterAlt />} onClick={toggleDrawer(true)} id="FilterCards">
            Filter Cards
          </Button>
        </div>
      </div>
      <Drawer
          variant="temporary"
          onBackdropClick={toggleDrawer(false)}
          open={state['drawerOpen']}
          PaperProps={{
            sx: { width: "20%" },
          }}
        >
          {rows}
      </Drawer>

    </div>
  );
}

export default App;
