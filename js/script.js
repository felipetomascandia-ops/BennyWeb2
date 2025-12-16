// Adjust footer year and handle forms + simple client-side auth
document.addEventListener('DOMContentLoaded', function(){
	const COMPANY_EMAIL = 'usapools.services@gmail.com'; // change if needed

	// footer year
	const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

	function openMailTo(to,subject,body){
		const mail = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		window.location.href = mail;
	}

	/* ----------------- existing contact & registration (site) forms ----------------- */
	const registerForm = document.getElementById('registerForm');
	const contactForm = document.getElementById('contactForm');

	if(registerForm){
		registerForm.addEventListener('submit', function(e){
			e.preventDefault();
			const name = document.getElementById('r-name').value.trim();
			const email = document.getElementById('r-email').value.trim();
			const phone = document.getElementById('r-phone').value.trim();
			const address = document.getElementById('r-address').value.trim();
			const service = document.getElementById('r-service').value;
			if(!name || !email){ alert('Please complete name and email.'); return; }
			const registrations = JSON.parse(localStorage.getItem('registrations')||'[]');
			registrations.push({name,email,phone,address,service,created:new Date().toISOString()});
			localStorage.setItem('registrations',JSON.stringify(registrations));
			const subject = `New registration - Pool Services`;
			const body = `New customer registered:%0AName: ${name}%0AEmail: ${email}%0APhone: ${phone}%0AAddress: ${address}%0AService: ${service}`;
			openMailTo(COMPANY_EMAIL,subject,body);
			alert('Registration saved. Your mail client will open to notify the company.');
			registerForm.reset();
		});
	}

	if(contactForm){
		contactForm.addEventListener('submit', function(e){
			e.preventDefault();
			const name = document.getElementById('c-name').value.trim();
			const email = document.getElementById('c-email').value.trim();
			const message = document.getElementById('c-message').value.trim();
			if(!name || !email || !message){ alert('Please complete all contact form fields.'); return; }
			const subject = `Website inquiry - ${name}`;
			const body = `Name: ${name}%0AEmail: ${email}%0A%0AMessage:%0A${message}`;
			openMailTo(COMPANY_EMAIL,subject,body);
			contactForm.reset();
		});
	}

	/* ----------------- simple client-side auth (localStorage) ----------------- */
	async function sha256Hex(message){
		const enc = new TextEncoder();
		const hash = await crypto.subtle.digest('SHA-256', enc.encode(message));
		return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
	}

	function getUsers(){
		return JSON.parse(localStorage.getItem('users')||'[]');
	}
	function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }

	async function registerUser(name,email,password){
		const users = getUsers();
		if(users.find(x=>x.email.toLowerCase()===email.toLowerCase())) return {ok:false,msg:'Email already registered'};
		const hash = await sha256Hex(password);
		users.push({name,email,hash,created:new Date().toISOString()});
		saveUsers(users);
		sessionStorage.setItem('currentUser', email);
		return {ok:true};
	}

	async function loginUser(email,password){
		const users = getUsers();
		const u = users.find(x=>x.email.toLowerCase()===email.toLowerCase());
		if(!u) return {ok:false,msg:'No account found for that email.'};
		const hash = await sha256Hex(password);
		if(hash !== u.hash) return {ok:false,msg:'Invalid password.'};
		sessionStorage.setItem('currentUser', u.email);
		return {ok:true,name:u.name};
	}

	function logoutUser(){ sessionStorage.removeItem('currentUser'); updateHeaderUserArea(); }
	function getCurrentUser(){ return sessionStorage.getItem('currentUser'); }

	// Register and login forms on register.html
	const createAccountForm = document.getElementById('createAccountForm');
	const loginForm = document.getElementById('loginForm');
	const authMessage = document.getElementById('authMessage');

	if(createAccountForm){
		createAccountForm.addEventListener('submit', async function(e){
			e.preventDefault();
			const name = document.getElementById('u-name').value.trim();
			const email = document.getElementById('u-email').value.trim();
			const p1 = document.getElementById('u-password').value;
			const p2 = document.getElementById('u-password2').value;
			if(!name||!email||!p1||!p2) return authMessage.textContent='Please fill all fields.';
			if(p1!==p2) return authMessage.textContent='Passwords do not match.';
			const res = await registerUser(name,email,p1);
			if(!res.ok) return authMessage.textContent = res.msg;
			authMessage.style.color='green'; authMessage.textContent='Account created. Redirecting...';
			updateHeaderUserArea();
			setTimeout(()=> location.href='index.html',800);
		});
	}

	if(loginForm){
		loginForm.addEventListener('submit', async function(e){
			e.preventDefault();
			const email = document.getElementById('l-email').value.trim();
			const pw = document.getElementById('l-password').value;
			if(!email||!pw) return authMessage.textContent='Please fill all fields.';
			const res = await loginUser(email,pw);
			if(!res.ok){ authMessage.textContent = res.msg; return; }
			authMessage.style.color='green'; authMessage.textContent='Logged in. Redirecting...';
			updateHeaderUserArea();
			setTimeout(()=> location.href='index.html',600);
		});
	}

	// Header user area
	function updateHeaderUserArea(){
		const userArea = document.getElementById('userArea');
		const authLink = document.getElementById('authLink');
		if(!userArea) return;
		const cur = getCurrentUser();
		if(cur){
			const users = getUsers();
			const u = users.find(x=>x.email===cur);
			const name = u?u.name:cur;
			userArea.innerHTML = `<span class="user-badge">${name}</span> <button id="logoutBtn" class="btn" style="margin-left:8px">Logout</button>`;
			if(authLink) authLink.style.display='none';
			const lb = document.getElementById('logoutBtn'); if(lb) lb.addEventListener('click', logoutUser);
		} else {
			userArea.innerHTML = '';
			if(authLink) authLink.style.display='inline-block';
		}
	}

	updateHeaderUserArea();

	// Gallery / lightbox for images and video
	function closeLightbox(){
		const existing = document.getElementById('lightbox-overlay');
		if(existing) existing.remove();
	}

	function openLightbox(type, src){
		closeLightbox();
		const overlay = document.createElement('div');
		overlay.id = 'lightbox-overlay';
		const contentWrap = document.createElement('div');
		contentWrap.id = 'lightbox-content';
		overlay.appendChild(contentWrap);
		const closeBtn = document.createElement('button');
		closeBtn.id = 'lightbox-close'; closeBtn.textContent = '✕';
		overlay.appendChild(closeBtn);
		if(type === 'image'){
			const img = document.createElement('img'); img.src = src; img.alt = '';
			contentWrap.appendChild(img);
		} else if(type === 'video'){
			const vid = document.createElement('video'); vid.src = src; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
			contentWrap.appendChild(vid);
		}
		document.body.appendChild(overlay);
		overlay.addEventListener('click', function(e){ if(e.target === overlay) closeLightbox(); });
		closeBtn.addEventListener('click', closeLightbox);
		document.addEventListener('keydown', function esc(e){ if(e.key === 'Escape'){ closeLightbox(); document.removeEventListener('keydown', esc); } });
	}

	// attach handlers to gallery thumbs
	const thumbs = document.querySelectorAll('.media-thumb');
	if(thumbs && thumbs.length){
		thumbs.forEach(t => t.addEventListener('click', function(){
			const type = this.dataset.type || 'image';
			const src = this.dataset.src;
			if(!src) return;
			openLightbox(type, src);
		}));
	}

	// Ensure social panel links open in new tabs safely (nothing else required but keep)
	const socialLinks = document.querySelectorAll('.social-fixed a');
	if(socialLinks && socialLinks.length){
		socialLinks.forEach(a => a.setAttribute('rel','noopener'));
	}

	// Splash animation: inject SVG overlay on first page load in session
	function createSplashOverlay(){
		try{
			const ov = document.createElement('div'); ov.id = 'splash-overlay';
			ov.innerHTML = `
			  <div class="splash-wrap">
			    <svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			      <defs>
			        <linearGradient id="wg" x1="0" x2="1"><stop offset="0%" stop-color="#9fe6ff"/><stop offset="100%" stop-color="#49bfff"/></linearGradient>
			        <filter id="blurMe"><feGaussianBlur stdDeviation="8"/></filter>
			      </defs>
			      <!-- main splash body -->
			      <g transform="translate(600,380)">
			        <path class="splash-main" d="M-220 30 C -180 -80 -80 -120 0 -110 C 80 -120 180 -80 220 30 C 160 -10 40 -40 -40 -10 C -120 -40 -240 -10 -220 30 Z" fill="url(#wg)" opacity="0.98"/>
			        <!-- droplets -->
			        <circle class="splash-droplet" cx="-260" cy="-20" r="8" fill="#9fe6ff" style="animation-delay:0.06s" />
			        <circle class="splash-droplet" cx="-190" cy="-60" r="6" fill="#aee9ff" style="animation-delay:0.12s" />
			        <circle class="splash-droplet" cx="-90" cy="-90" r="7" fill="#9fe6ff" style="animation-delay:0.18s" />
			        <circle class="splash-droplet" cx="40" cy="-100" r="9" fill="#8fe0ff" style="animation-delay:0.22s" />
			        <circle class="splash-droplet" cx="160" cy="-70" r="6" fill="#bff2ff" style="animation-delay:0.28s" />
			        <circle class="splash-droplet" cx="260" cy="-30" r="7" fill="#9fe6ff" style="animation-delay:0.34s" />
			        <!-- ripple -->
			        <ellipse class="splash-ripple" cx="0" cy="40" rx="60" ry="18" stroke="#fff" fill="none" style="animation-delay:0.14s" />
			      </g>
			    </svg>
			  </div>`;
			document.body.appendChild(ov);
			// remove after animation finishes
			setTimeout(()=>{ ov.style.transition='opacity .5s'; ov.style.opacity='0'; setTimeout(()=> ov.remove(),600); }, 1400);
		}catch(e){ console.warn('splash overlay failed', e); }
	}

	createSplashOverlay();
});

	// ----------------- Google Places panel (optional) -----------------
	// This function will be invoked by the Google Maps JS API callback `initPlacePanel`.
	// Replace YOUR_GOOGLE_API_KEY in the script tag in about.html with a real API key
	// that has Maps JavaScript API + Places API enabled. Restrict key to your domain.
	window.initPlacePanel = function(){
		try{
			const panel = document.getElementById('place-panel');
			if(!panel) return;
			// Use PlacesService TextSearch to find the business by name + locality
			const service = new google.maps.places.PlacesService(document.createElement('div'));
			const query = 'USA Pools Services LLC Horsham PA';
			service.textSearch({query: query}, function(results, status){
				if(status !== google.maps.places.PlacesServiceStatus.OK || !results || !results.length){
					panel.innerHTML = '<p>Business not found via Places. Please check your API key and that the place exists.</p>';
					return;
				}
				const place = results[0];
				service.getDetails({placeId: place.place_id, fields: ['name','rating','formatted_phone_number','website','reviews','formatted_address','url']}, function(details, st){
					if(st !== google.maps.places.PlacesServiceStatus.OK || !details){
						panel.innerHTML = '<p>Could not load place details.</p>';
						return;
					}
					// render panel similar to Google Business Profile
					const reviews = (details.reviews||[]).slice(0,4);
					const html = [];
					html.push(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><h3 style="margin:0">${details.name}</h3><div style="margin-left:auto;font-weight:700">${details.rating||'–'} ★</div></div>`);
					if(details.formatted_phone_number) html.push(`<p><strong>Phone:</strong> <a href="tel:${details.formatted_phone_number.replace(/[^+0-9]/g,'')}">${details.formatted_phone_number}</a></p>`);
					if(details.formatted_address) html.push(`<p>${details.formatted_address}</p>`);
					if(details.website) html.push(`<p><a href="${details.website}" target="_blank" rel="noopener">Website</a> · <a href="${details.url}" target="_blank" rel="noopener">Google profile</a></p>`);
					if(reviews.length){
						html.push('<div class="reviews">');
						reviews.forEach(r=>{
							html.push(`<div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:10px;margin-top:10px"><strong>${r.author_name}</strong> <span style="color:#f5c518">${r.rating} ★</span><p style="margin:.25rem 0">${r.text.length>280? r.text.slice(0,280)+'...': r.text}</p></div>`);
						});
						html.push('</div>');
					} else {
						html.push('<p>No reviews available.</p>');
					}
					panel.innerHTML = html.join('');
				});
			});
		}catch(err){
			console.error('initPlacePanel error', err);
			const panel = document.getElementById('place-panel'); if(panel) panel.innerHTML = '<p>Error loading place panel.</p>';
		}
	};
