const tradeId = 'd5f76b47-4f14-4478-95e3-06303278d61a';
fetch(`http://localhost:3000/api/trades?id=${tradeId}`, { method: 'DELETE' })
    .then(res => {
        if (res.ok) console.log('Trade deleted successfully');
        else console.log('Failed to delete trade', res.status);
    })
    .catch(err => console.error('Error:', err));
