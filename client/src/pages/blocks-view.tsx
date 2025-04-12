import React from 'react';
import { Link } from 'wouter';
import BlocksTable from '../components/BlocksTable';
import { Button } from '@/components/ui/button';

export default function BlocksView() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Bitcoin Block Data</h1>
      
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <p className="text-muted-foreground mb-4">
          This page shows real blockchain data from your Neon database. The data shown here is fetched from the database tables you created.
        </p>
        <div className="flex justify-center space-x-4">
          <Button asChild variant="default">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <BlocksTable limit={15} />
      </div>
      
      <div className="mt-12 max-w-3xl mx-auto text-center border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">About This Data</h2>
        <p className="text-muted-foreground mb-4">
          This component connects to your Neon database using the connection string you provided. 
          The blocks and miner data you see are fetched from the database tables that were created.
        </p>
        <p className="text-muted-foreground">
          You can further customize this application by adding more views and features that use your blockchain data.
        </p>
      </div>
    </div>
  );
}