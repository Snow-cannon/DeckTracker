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

function CardEntry(props) {
  const [state, setState] = React.useState({
    elevation: 4,
  });
  const onMouseOver = () => setState({ ...state, elevation: 8 });

  const onMouseOut = () => setState({ ...state, elevation: 4 });

  return(
  <Card
    sx={{ minWidth: 650, maxWidth: 800 }}
    elevation={state["elevation"]}
    onMouseOver={onMouseOver}
    onMouseOut={onMouseOut}
    className="mtgCard"
  >
    <CardContent>
      <Typography sx={{ fontSize: "100%" }} color="text.secondary">
        {props.cardName}
      </Typography>
    </CardContent>
    <CardActions className={"parentFlexRight"}>
      <Fab
        size="small"
        color="primary"
        aria-label="remove"
        className="card-action-btn"
      >
        <Remove />
      </Fab>
      <Fab
        size="small"
        color="primary"
        aria-label="add"
        className="card-action-btn"
      >
        <Add />
      </Fab>
    </CardActions>
  </Card>);
}

function CardList(props) {
  return (
    <Stack spacing={2}>
      {props.cards.map((card, i) => {
        return <CardEntry cardName={card} key={i} />;
      })}
    </Stack>
  );
}

export default CardList;
