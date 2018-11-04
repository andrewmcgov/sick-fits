import React, { Component } from "react";
import styled, { ThemeProvider, injectGlobal } from "styled-components";

import Header from "../components/Header";
import Meta from "../components/Meta";

// This file is the main layout file, each page uses this temlate,
// and the router renders it's content in here as {this.props.children}

// Global styles for styled components
// This object is passed to the ThemeProvider component below
const theme = {
  red: "#FF0000",
  black: "#393939",
  grey: "#3A3A3A",
  lightgrey: "#E1E1E1",
  offWhite: "#EDEDED",
  maxWidth: "1000px",
  bs: "0 12px 24px 0 rgba(0, 0, 0, 0.09)"
};

// styled-components let's you create your own custom
// components with their own scoped styles attached to them
// They are used just like any other component
const StyledPage = styled.div`
  background: white;
  color: ${props => props.theme.black};
`;

const Inner = styled.div`
  max-width: ${props => props.theme.maxWidth};
  margin 0 auto;
  padding: 2rem;
`;

// Use injectGlobal to add styles to the entire page,
// these styles are not scoped like styled components are
// injectGlobal does not have access top props.theme
// But in this case it is in the same file
injectGlobal`
  @font-face {
    font-family: 'radnika_next';
    src: url('/static/radnikanext-medium-webfont.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }
  html {
    box-sizing: border-box;
    font-size: 10px;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  body {
    padding: 0;
    margin: 0;
    font-size: 1.5rem;
    line-height: 2;
    font-family: 'radnika_next';
  }
  a {
    text-decoration: none;
    color: ${theme.black};
  }
  button {  font-family: 'radnika_next'; }
`;

class Page extends Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <StyledPage>
          <Meta />
          <Header />
          <Inner>{this.props.children}</Inner>
        </StyledPage>
      </ThemeProvider>
    );
  }
}

export default Page;
