import * as React from 'react';
import { styled, alpha } from '@mui/material';
import { AppBar } from '@mui/material';
import { Box } from '@mui/material';
import { Toolbar } from '@mui/material';
import { Typography } from '@mui/material';
import { InputBase } from '@mui/material';
import { Search } from '@mui/icons-material';
import { Button } from '@mui/material'
import { LoginPopup } from './loginPopup.js';
import { SignupPopup } from './signupPopup.js';

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function PrimarySearchAppBar(props) {
  const [state, setState] = React.useState({
    loginOpen: false,
    signupOpen: false
  });
  const openLogin = () => {
    setState({ ...state, loginOpen: true });
  }
  const closeLogin = () => {
    setState({ ...state, loginOpen: false });
  };
  const openSignup = () => {
    setState({ ...state, signupOpen: true });
  }
  const closeSignup = () => {
    setState({ ...state, signupOpen: false });
  };
  let menuComp = (<div> <Button color="inherit" onClick={openSignup}>Sign Up</Button>
    <Button color="inherit" onClick={openLogin}>Login</Button> </div>)
  {
    if (props.user !== '') {
      menuComp =
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {props.user}
        </Typography>
    }
  }


  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Deck Tracker
          </Typography>
          <SearchBox onChange={(e) => props.setParentState(e.target.value)}>
            <SearchIconWrapper>
              <Search />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchBox>
          <Box sx={{ flexGrow: 1 }} />
          {menuComp}
        </Toolbar>
      </AppBar>
      <SignupPopup open={state['signupOpen']} onClose={closeSignup} setUserState={props.setUserState}></SignupPopup>
      <LoginPopup open={state['loginOpen']} onClose={closeLogin} setUserState={props.setUserState}></LoginPopup>
    </Box>
  );
}
