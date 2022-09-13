// import logo from './logo.svg';
import './App.css';
import { Checkbox } from '@mui/material';
import { FormGroup } from '@mui/material';
import { FormControlLabel } from '@mui/material';
import * as React from 'react';
import { Accordion } from '@mui/material';
import { AccordionSummary } from '@mui/material';
import { AccordionDetails } from '@mui/material';
import { Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Drawer } from '@mui/material';
import { Button } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import CardList from "./CardList.js";
import { Box } from "@mui/system";
import sampleCards from "./sampleCards.json";
import PrimarySearchAppBar from "./navBar.js";

let cards = [];
for (const card in sampleCards) {
  cards.push({ name: card, ...sampleCards[card] })
}
cards.push({ name: "A", colors: ["W", "U", "B", "R", "G"] })

function App(props) {
  const [state, setState] = React.useState({
    drawerOpen: false,
  });

  let filterProps = {search: ""};
  for(const filt in props.filterOptions){
    filterProps[filt] = [];
  }

  const [cardState, setCardState] = React.useState({
    cards: cards,
    filters: filterProps
  });



  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, drawerOpen: open });
  };

  let timeout = 0;
  const setCardSearchFilter = (string) => {
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      cardState['filters']['search'] = string;
      applyFilters();
    }, 150);

  }

  const setCheckBoxFilter = (option, filter, checked) => {
    if (checked) {
      cardState['filters'][option].push(filter);
    }
    else {
      const index = cardState['filters'][option].indexOf(filter);
      if (index > -1) { // only splice array when item is found
        cardState['filters'][option].splice(index, 1); // 2nd parameter means remove one item only
      }
    }
    applyFilters();
  }

  const applyFilters = () => {
    let cards = [];
    for (const card in sampleCards) {
      if (checkCard(cardState['filters'], {name: card, ...sampleCards[card]})) {
        cards.push({ name: card, ...sampleCards[card] })
      }
    }
    setCardState({ ...cardState, cards: cards });
  };

  const checkCard = (filters, card) => {
    return checkCardColor(filters['Color'], card) && checkCardSearch(filters.search, card);
  }

  const checkCardColor = (filters, card) => {
    const color_mapping = { "White": "W", "Blue": "U", "Black": "B", "Red": "R", "Green": "G"};
    if(filters.includes("Colorless")){
      return card.colors.length === 0;
    }
    for (const filter of filters) {
      if (!card.colors.includes(color_mapping[filter])) {
        return false;
      }
    }
    return true;
  }

  const checkCardSearch = (search, card) => {
    return search === "" || card.name.toLowerCase().includes(search.toLowerCase());
  }

  let rows = [];
  let index = 0;
  for (const option in props.filterOptions) {
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
            {props.filterOptions[option].map(function (choice, i) {
              return <FormControlLabel control={<Checkbox onChange={(e) => setCheckBoxFilter(option, choice, e.target.checked)} />} label={choice} key={i} />
            }
            )}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    );
    index++;
  }

  return (
    <div>
      <PrimarySearchAppBar setParentState={setCardSearchFilter}/>
      <div id="bx">
        <div className="b">
          <Button variant="contained" endIcon={<FilterAlt />} onClick={toggleDrawer(true)} id="FilterCards">
            Filter Cards
          </Button>
        </div>
      </div>
      <Drawer
        onBackdropClick={toggleDrawer(false)}
        open={state['drawerOpen']}
        PaperProps={{
          sx: { width: "40%" },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {rows}
        <Button variant="contained" endIcon={<FilterAlt />} id="FilterCards" sx={{ margin: 1 }}>
          Clear Filters
        </Button>
      </Drawer>
      <Box display="flex" justifyContent="center" minHeight="90vh" marginTop={'10%'} marginBottom={'10%'}>
        <CardList cards={cardState['cards']} />
      </Box>
    </div>

  );
}

export default App;
