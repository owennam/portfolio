import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataFilePath = path.join(process.cwd(), 'data', 'trades.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const trades = JSON.parse(fileContent);
    return Response.json(trades);
  } catch (error) {
    return Response.json({ error: 'Failed to read trades' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const trade = await request.json();
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const trades = JSON.parse(fileContent);

    const newTrade = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...trade, // date, type, assetClass, ticker, price, quantity
    };

    trades.push(newTrade);

    await fs.writeFile(dataFilePath, JSON.stringify(trades, null, 2));

    return Response.json(newTrade);
  } catch (error) {
    return Response.json({ error: 'Failed to save trade' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    let trades = JSON.parse(fileContent);

    const initialLength = trades.length;
    trades = trades.filter(trade => trade.id !== id);

    if (trades.length === initialLength) {
      return Response.json({ error: 'Trade not found' }, { status: 404 });
    }

    await fs.writeFile(dataFilePath, JSON.stringify(trades, null, 2));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updateData = await request.json();
    const { id, ...updates } = updateData;

    if (!id) {
      return Response.json({ error: 'Trade ID is required' }, { status: 400 });
    }

    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    let trades = JSON.parse(fileContent);

    const tradeIndex = trades.findIndex(t => t.id === id);
    if (tradeIndex === -1) {
      return Response.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Update fields
    trades[tradeIndex] = { ...trades[tradeIndex], ...updates };

    await fs.writeFile(dataFilePath, JSON.stringify(trades, null, 2));

    return Response.json(trades[tradeIndex]);
  } catch (error) {
    return Response.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}
