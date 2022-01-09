const set_activity = client => {
    if (process.env.adress)
        client.user.setActivity();
    else
        client.user.setActivity('Тестирование', { type: 'STREAMING' });
}

module.exports = set_activity;