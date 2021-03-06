import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Container, Row } from 'reactstrap';

import configureStore from './store';
import {apiGet, ApiError} from './generic/apiCall';
import {loggedIn, loggedOut} from './actions/auth';
import MainContent from './MainContentContainer';
import QuickNotification from './containers/QuickNotification';
import Navigation from './Navigation';
import { fetchTime } from './actions/time';
import './App.css';
require('bootstrap');
require('malihu-custom-scrollbar-plugin');

const { store, persistor } = configureStore();

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {loading: true};
  }

  componentDidMount() {
    window.addEventListener('load', () => {
      if(window.ethereum) {
        window.web3 = new window.Web3(window.ethereum);
      } else if (window.web3) {
        window.web3 = new window.Web3(window.web3.currentProvider);
      }
      if(store.getState().auth.loggedIn) {
        apiGet('/profile')
          .then(({profile}) => {
            store.dispatch(loggedIn(profile));
          })
          .catch(err => {
            if(err.apiErrorCode && err.apiErrorCode === ApiError.FORBIDDEN) {
              store.dispatch(loggedOut());
            }
          })
          .then(() => {
            this.setState({loading: false});
          });
      } else {
        this.setState({loading: false});
      }
    });
    store.dispatch(fetchTime());
    this.timeInterval = setInterval(() => {
      store.dispatch(fetchTime());
    }, 10000);
  }

  componentWillUnmount() {
    clearInterval(this.timeInterval);
  }

  render() {
    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          {this.state.loading ? <div/> : (<MainRouter />)}
        </PersistGate>
      </Provider>
    );
  }
}

const MainRouter = () => (
  <BrowserRouter>
    <Container className="main-panel" fluid>
      <Row id="top-banner" style={{minHeight: 'unset'}} />
      <Row noGutters className='flex-wrap flex-md-nowrap'>
        <Navigation />
        <MainContent />
      </Row>
      <QuickNotification />
    </Container>
  </BrowserRouter>
);

export default App;
