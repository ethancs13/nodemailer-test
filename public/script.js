document.addEventListener('DOMContentLoaded', function () {
  axios.get('/client-id')
    .then(response => {
      const clientId = response.data.clientId;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById('buttonDiv'),
        { theme: 'outline', size: 'large' }
      );
      google.accounts.id.prompt();
    })
    .catch(error => {
      console.error('Error fetching client ID:', error);
    });
});

function handleCredentialResponse(response) {
  console.log('Encoded JWT ID token: ' + response.credential);

  axios.post('/send-email', {
    token: response.credential
  })
  .then(response => {
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    return response.data;
  })
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
}
