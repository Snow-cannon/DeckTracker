// import logo from './logo.svg';
import "./App.css";
import * as React from "react";
import { Card } from "@mui/material";
import { CardContent } from "@mui/material";
import { Typography } from "@mui/material";
import { CardActions } from "@mui/material";
import { Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import { Remove } from "@mui/icons-material";
import { Fab } from "@mui/material";
import manaSymbols from "./mana_symbols.json";

function CardEntry(props) {
  const [state, setState] = React.useState({
    elevation: 4,
    has: parseInt(props.cardData.has) || 0,
    needs: parseInt(props.cardData.needs) || 0
  });
  const onMouseOver = () => setState({ ...state, elevation: 8 });
  const onMouseOut = () => setState({ ...state, elevation: 4 });

  const onAddition = () => setState({ ...state, has: state['has']+1 });
  const onSubtraction = () => setState({ ...state, has: state['has']-1 });

  let uncoloredPip = [];
  if (!props.cardData.colors.length) {
    uncoloredPip = (
      <img src={manaSymbols["C"]} alt="Color-symbol" className="manaIcon"></img>
    );
  }

  return (
    <Card
      sx={{ minWidth: 650, maxWidth: 800 }}
      elevation={state["elevation"]}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      className="mtgCard"
    >
      <CardContent>
        <Typography sx={{ fontSize: "100%" }} color="text.primary">
          {props.cardData.name}
        </Typography>
      </CardContent>
      <CardActions className={"parentFlexRight"}>
        <div className="manaIconContainer">
        {uncoloredPip}
        {props.cardData.colors.map((c, i) => {
          return (
            <img
              src={manaSymbols[c]}
              alt="Color-symbol"
              className="manaIcon"
              key={i}
            ></img>
          )
        })}
        </div>
        <Typography sx={{ fontSize: "100%"}} color="text.primary" marginRight={5}>
          {state['has']}/{state['needs']}
        </Typography>
        <Fab
          size="small"
          color="primary"
          aria-label="remove"
          className="card-action-btn"
          onClick={onSubtraction}
        >
          <Remove />
        </Fab>
        <Fab
          size="small"
          color="primary"
          aria-label="add"
          className="card-action-btn"
          onClick={onAddition}
        >
          <Add />
        </Fab>
      </CardActions>
    </Card>
  );
}

function CardList(props) {
  return (
    <Stack spacing={2}>
      {props.cards.sort((a, b) => ('' + a.name).localeCompare(b.name)).map((card, i) => {
        return <CardEntry cardData={card} key={i} />;
      })}
    </Stack>
  );
}

export default CardList;
