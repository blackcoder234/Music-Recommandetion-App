import  api  from './api.js';

/**
 * Tracks visitor information by fetching IP details and sending to backend
 */
export async function trackVisitor() {
    try {
        // 1. Check if we already tracked this session (optional, to reduce API calls)
        const hasTracked = sessionStorage.getItem('visitor_tracked');
        if (hasTracked) return;

        // 2. Fetch User Info from external IP API
        // https://ipapi.co/json/ is a popular free tier service
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch IP info');
        
        const data = await response.json();

        // 3. Prepare payload matching backend expectations
        const visitorData = {
            ip: data.ip,
            ip_version: data.version, // 'IPv4' or 'IPv6'
            city: data.city,
            region: data.region,
            country: data.country_name,
            longitude: data.longitude,
            network_org: data.org
        };

        // 4. Send to our Backend
        await api.request('/users/save-userInfo', {
            method: 'POST',
            body: JSON.stringify(visitorData)
        });

        // 5. Mark session as tracked
        sessionStorage.setItem('visitor_tracked', 'true');
        console.log('Visitor tracked successfully:', data.country_name);

    } catch (error) {
        console.warn('Visitor tracking failed:', error);
        // Fail silently so user experience is not affected
    }
}
