import App, { Container } from "next/app";
import Page from "../components/Page";

// _app.js is used in Next.js to allow custom content that is used on every page, above the router
class MyApp extends App {
  render() {
    const { Component } = this.props;

    return (
      <Container>
        <Page>
          <Component />
        </Page>
      </Container>
    );
  }
}

export default MyApp;
