SIGNUP_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sign up</title>
</head>
<body>
  <h1>Sign up</h1>
  <form id="signup">
    <label>Username <input type="text" id="username" autocomplete="username" required></label>
    <label>Display name <input type="text" id="display_name"></label>
    <button type="submit">Create account with passkey</button>
  </form>
  <p id="status"></p>

  <script>
    const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const bytesToB64url = (b) => btoa(String.fromCharCode(...b)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');

    async function getOptions() {
      const res = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: document.getElementById('username').value.trim(),
          display_name: document.getElementById('display_name').value.trim() || document.getElementById('username').value.trim()
        })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'failed');
      return res.json();
    }

    function toPublicKeyCredentialCreationOptions(o) {
      const pkco = {
        challenge: b64urlToBytes(o.challenge),
        rp: o.rp, user: { ...o.user, id: b64urlToBytes(o.user.id) },
        pubKeyCredParams: o.pubKeyCredParams,
        timeout: o.timeout,
        attestation: o.attestation
      };
      if (o.authenticatorSelection) pkco.authenticatorSelection = o.authenticatorSelection;
      if (o.excludeCredentials) pkco.excludeCredentials = o.excludeCredentials.map(c => ({ ...c, id: b64urlToBytes(c.id) }));
      return pkco;
    }

    function toRegistrationCredential(cred) {
      return {
        id: cred.id,
        rawId: bytesToB64url(new Uint8Array(cred.rawId)),
        type: cred.type,
        response: {
          clientDataJSON: bytesToB64url(new Uint8Array(cred.response.clientDataJSON)),
          attestationObject: bytesToB64url(new Uint8Array(cred.response.attestationObject))
        },
        clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}
      };
    }

    document.getElementById('signup').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('status');
      try {
        const { challenge_id, options } = await getOptions();
        const cred = await navigator.credentials.create({ publicKey: toPublicKeyCredentialCreationOptions(options) });
        const res = await fetch('/api/auth/webauthn/register/verify', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ challenge_id, response: toRegistrationCredential(cred) })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'verify failed');
        status.textContent = 'Account created! Redirecting...';
        window.location.href = '/';
      } catch (err) {
        status.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>
"""

LOGIN_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Log in</title>
</head>
<body>
  <h1>Log in</h1>
  <form id="login">
    <label>Username <input type="text" id="username" autocomplete="username" required></label>
    <button type="submit">Log in with passkey</button>
  </form>
  <p id="status"></p>

  <script>
    const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const bytesToB64url = (b) => btoa(String.fromCharCode(...b)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');

    async function getOptions() {
      const res = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: document.getElementById('username').value.trim() })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'failed');
      return res.json();
    }

    function toPublicKeyCredentialRequestOptions(o) {
      return {
        challenge: b64urlToBytes(o.challenge),
        timeout: o.timeout,
        rpId: o.rpId,
        userVerification: o.userVerification,
        allowCredentials: (o.allowCredentials || []).map(c => ({ ...c, id: b64urlToBytes(c.id) }))
      };
    }

    function toAuthenticationCredential(cred) {
      return {
        id: cred.id,
        rawId: bytesToB64url(new Uint8Array(cred.rawId)),
        type: cred.type,
        response: {
          clientDataJSON: bytesToB64url(new Uint8Array(cred.response.clientDataJSON)),
          authenticatorData: bytesToB64url(new Uint8Array(cred.response.authenticatorData)),
          signature: bytesToB64url(new Uint8Array(cred.response.signature)),
          userHandle: cred.response.userHandle ? bytesToB64url(new Uint8Array(cred.response.userHandle)) : null
        },
        clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}
      };
    }

    document.getElementById('login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('status');
      try {
        const { challenge_id, options } = await getOptions();
        const cred = await navigator.credentials.get({ publicKey: toPublicKeyCredentialRequestOptions(options) });
        const res = await fetch('/api/auth/webauthn/login/verify', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ challenge_id, response: toAuthenticationCredential(cred) })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'verify failed');
        status.textContent = 'Logged in! Redirecting...';
        window.location.href = '/';
      } catch (err) {
        status.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>
"""
