import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PlaceBets from "@/pages/place-bets";
import Stats from "@/pages/stats";
import BitcoinMining from "@/pages/bitcoin-mining";
import Admin from "@/pages/admin";
import BlockDetails from "@/pages/block-details/[height]";
import BlocksView from "./pages/blocks-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/place-bets" component={PlaceBets} />
      <Route path="/stats" component={Stats} />
      <Route path="/bitcoin-mining" component={BitcoinMining} />
      <Route path="/admin" component={Admin} />
      <Route path="/block-details/:height" component={BlockDetails} />
      <Route path="/blocks-view" component={BlocksView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
