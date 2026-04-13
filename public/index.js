const subForm = document.getElementById('subscribeForm');
const repoInput = document.getElementById('repo');
const subEmailInput = document.getElementById('subEmail');
const subMsg = document.getElementById('subMsg');
const subBtn = document.getElementById('subBtn');

const viewEmailInput = document.getElementById('viewEmail');
const viewBtn = document.getElementById('viewBtn');
const subsList = document.getElementById('subscriptionsList');
const viewMsg = document.getElementById('viewMsg');

const API_KEY = 'DEMO_KEY_12345';

const suggestions = [
    'spring-projects/spring-boot',
    'vuejs/core',
    'axios/axios',
    'expressjs/express',
    'obsidianmd/obsidian-releases'
];

/*
    Only for extra point for API key authentication: endpoints secured with a token in the header

    Because I cant change swagger, what closes way to authenticate in swagger via api key, I also must show API KEY in frontend.
    For serious purposes better using JWT and other methods.
 */
const apiClient = axios.create({
    headers: {
        'X-API-KEY': API_KEY
    },
    timeout: 10000
});

const subscribe = async (email, repo) => {
    try {
        const response = await apiClient.post('/api/subscribe', { email, repo });
        console.log(response.data.message);
    } catch (err) {
        console.error(err.response?.data?.error || 'Network error');
    }
};

const renderSuggestions = () => {
    const sugUl = document.getElementById('suggestedList');
    if (!sugUl) return;

    suggestions.forEach(name => {
        const li = document.createElement('li');
        li.style.marginBottom = "5px";
        li.innerHTML = `<a href="#" style="color:blue; cursor:pointer; text-decoration:underline;">${name}</a>`;

        li.onclick = (e) => {
            e.preventDefault();
            repoInput.value = name;
        };
        sugUl.appendChild(li);
    });
};

subForm.onsubmit = async (e) => {
    e.preventDefault();

    subMsg.style.color = 'black';
    subMsg.innerText = 'Sending request...';
    subBtn.disabled = true;

    const payload = {
        email: subEmailInput.value,
        repo: repoInput.value
    };

    try {
        const res = await apiClient.post('/api/subscribe', payload);
        subMsg.style.color = 'green';
        subMsg.innerText = 'Done! ' + res.data.message;
        repoInput.value = '';
    } catch (err) {
        subMsg.style.color = 'red';
        const errorText = err.response?.data?.error;
        subMsg.innerText = 'Error: ' + errorText;
    } finally {
        subBtn.disabled = false;
    }
};

viewBtn.onclick = async () => {
    const email = viewEmailInput.value;
    if (!email) {
        alert('Enter email for search');
        return;
    }

    viewMsg.innerText = 'Download...';
    viewMsg.style.color = 'black';
    subsList.innerHTML = '';
    viewBtn.disabled = true;

    try {
        const res = await apiClient.get('/api/subscriptions', { params: { email } });
        const subs = res.data;

        if (subs.length === 0) {
            viewMsg.innerText = 'No subscriptions found for this email.';
            return;
        }

        viewMsg.innerText = `Find subscriptions: ${subs.length}`;

        subs.forEach(s => {
            const li = document.createElement('li');
            li.style.padding = "10px";
            li.style.borderBottom = "1px solid #ddd";
            li.innerHTML = `
                <strong>${s.repo}</strong> 
                <span style="color: ${s.confirmed ? 'green' : 'orange'}">
                    (${s.confirmed ? 'Confirmed' : 'Waiting for confirmation'})
                </span>
                <br><small>Last tag: ${s.last_seen_tag || 'no data'}</small>
            `;
            subsList.appendChild(li);
        });
    } catch (err) {
        viewMsg.style.color = 'red';
        viewMsg.innerText = 'Unable to download subscriptions';
        console.error('Fetch error:', err);
    } finally {
        viewBtn.disabled = false;
    }
};

renderSuggestions();