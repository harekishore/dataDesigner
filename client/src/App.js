import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import logo from './moengage-logo-dark-2.svg';

function App() {
  const [appUrl, setAppUrl] = useState('');
  const [vertical, setVertical] = useState('ecommerce');
  const [goals, setGoals] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [usecases, setUsecases] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const urlInputRef = useRef();
  const aiUsecasesByVertical = useRef({});

  // Load cached usecases and result from localStorage on mount
  useEffect(() => {
    const cachedUsecases = localStorage.getItem('aiUsecasesByVertical');
    if (cachedUsecases) {
      aiUsecasesByVertical.current = JSON.parse(cachedUsecases);
    }
    const cachedResult = localStorage.getItem('sampleDataDesignResult');
    if (cachedResult) {
      setResult(JSON.parse(cachedResult));
    }
  }, []);

  // Save AI usecases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiUsecasesByVertical', JSON.stringify(aiUsecasesByVertical.current));
  }, [usecases]);

  // Save sample data design result to localStorage whenever it changes
  useEffect(() => {
    if (result) {
      localStorage.setItem('sampleDataDesignResult', JSON.stringify(result));
    }
  }, [result]);

  // Static sample usecases by vertical and channel
  const staticUsecases = {
    ecommerce: [
      { name: 'Cart Abandonment Recovery', segment: 'Users who added to cart but did not purchase in 24h', message: 'Hi {{first_name}}, you left something in your cart! Complete your purchase and enjoy 10% off.', channel: 'Push' },
      { name: 'Welcome Offer', segment: 'New signups in last 7 days', message: 'Welcome {{first_name}}! Use code WELCOME10 for 10% off your first order.', channel: 'Email' },
      { name: 'Re-Engagement', segment: 'Users inactive for 30 days', message: 'We miss you, {{first_name}}! Here’s a special offer to bring you back.', channel: 'Push' },
      { name: 'Loyalty Reward', segment: 'Top 5% spenders in last 3 months', message: 'Thank you {{first_name}} for being a loyal customer! Enjoy exclusive rewards.', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who completed a purchase', message: 'Hi {{first_name}}, how was your experience? Share feedback and get a chance to win a gift card.', channel: 'SMS' },
      { name: 'Order Shipped', segment: 'Users with shipped orders', message: 'Hi {{first_name}}, your order {{order_id}} has been shipped!', channel: 'Push' },
      { name: 'Price Drop Alert', segment: 'Users who viewed a product, price dropped', message: 'Good news {{first_name}}! The price for {{product_name}} has dropped. Grab it now!', channel: 'Email' },
      { name: 'Birthday Offer', segment: 'Users with birthday this month', message: 'Happy Birthday {{first_name}}! Enjoy a special gift from us.', channel: 'Push' },
      { name: 'Wishlist Reminder', segment: 'Users with items in wishlist', message: 'Hi {{first_name}}, items in your wishlist are waiting for you!', channel: 'WhatsApp' },
      { name: 'COD Confirmation', segment: 'Users who chose Cash on Delivery', message: 'Hi {{first_name}}, please confirm your COD order {{order_id}}.', channel: 'SMS' },
      { name: 'Referral Bonus', segment: 'Users who referred friends', message: 'Thanks for referring, {{first_name}}! You’ve earned a bonus.', channel: 'Email' },
      { name: 'App Download Prompt', segment: 'Mobile web users', message: 'Download our app for exclusive deals, {{first_name}}!', channel: 'Push' },
      { name: 'Back in Stock', segment: 'Users who requested restock alert', message: 'Hi {{first_name}}, {{product_name}} is back in stock!', channel: 'Push' },
      { name: 'First Purchase Offer', segment: 'Users who never purchased', message: 'Complete your first purchase and get 15% off, {{first_name}}!', channel: 'Email' },
      { name: 'Order Delivered', segment: 'Users with delivered orders', message: 'Hi {{first_name}}, your order {{order_id}} has been delivered. Enjoy!', channel: 'WhatsApp' }
    ],
    fintech: [
      { name: 'KYC Reminder', segment: 'Users with incomplete KYC', message: 'Hi {{first_name}}, complete your KYC to unlock all features.', channel: 'Push' },
      { name: 'Bill Payment Reminder', segment: 'Users with upcoming bills', message: 'Hi {{first_name}}, your bill for {{bill_type}} is due soon. Pay now!', channel: 'SMS' },
      { name: 'Investment Opportunity', segment: 'Users with idle balance', message: 'Grow your savings, {{first_name}}! Check out new investment options.', channel: 'Email' },
      { name: 'Loan Offer', segment: 'Pre-approved users', message: 'Hi {{first_name}}, you are pre-approved for a personal loan.', channel: 'Push' },
      { name: 'Transaction Success', segment: 'Users who completed a transaction', message: 'Your transaction of {{amount}} was successful, {{first_name}}.', channel: 'WhatsApp' },
      { name: 'Failed Transaction Alert', segment: 'Users with failed transactions', message: 'Hi {{first_name}}, your transaction failed. Please try again.', channel: 'SMS' },
      { name: 'Refer & Earn', segment: 'All users', message: 'Refer friends and earn rewards, {{first_name}}!', channel: 'Email' },
      { name: 'Credit Card Usage', segment: 'Credit card holders', message: 'Hi {{first_name}}, use your card for exciting offers.', channel: 'Push' },
      { name: 'Low Balance Alert', segment: 'Users with low balance', message: 'Hi {{first_name}}, your account balance is low.', channel: 'SMS' },
      { name: 'App Update', segment: 'All users', message: 'Update your app for new features, {{first_name}}!', channel: 'Push' }
    ],
    travel: [
      { name: 'Booking Reminder', segment: 'Users who searched but did not book', message: 'Hi {{first_name}}, complete your booking for {{destination}} and get 10% off!', channel: 'Push' },
      { name: 'Check-in Alert', segment: 'Users with upcoming flights', message: 'Hi {{first_name}}, check-in is now open for your flight to {{destination}}.', channel: 'Email' },
      { name: 'Last Minute Deals', segment: 'Users with no bookings in 60 days', message: 'Hi {{first_name}}, grab last minute deals to your favorite destinations!', channel: 'Push' },
      { name: 'Travel Safety Tips', segment: 'All travelers', message: 'Stay safe, {{first_name}}! Here are some travel tips for your journey.', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who completed a trip', message: 'Hi {{first_name}}, how was your trip to {{destination}}? Share your feedback.', channel: 'SMS' }
    ],
    edtech: [
      { name: 'Course Completion Reminder', segment: 'Users who started but not completed a course', message: 'Hi {{first_name}}, complete your course {{course_name}} and earn a certificate!', channel: 'Push' },
      { name: 'New Course Launch', segment: 'All users', message: 'Hi {{first_name}}, check out our new course: {{course_name}}.', channel: 'Email' },
      { name: 'Quiz Participation', segment: 'Users who have not attempted quizzes', message: 'Test your knowledge, {{first_name}}! Attempt the quiz for {{course_name}}.', channel: 'Push' },
      { name: 'Subscription Renewal', segment: 'Users with expiring subscriptions', message: 'Hi {{first_name}}, renew your subscription to keep learning.', channel: 'SMS' },
      { name: 'Achievement Unlocked', segment: 'Users who completed a milestone', message: 'Congrats {{first_name}}! You unlocked a new achievement in {{course_name}}.', channel: 'Push' }
    ],
    gaming: [
      { name: 'Level Up Alert', segment: 'Users who reached a new level', message: 'Congrats {{first_name}}! You’ve reached level {{level}}. Keep playing!', channel: 'Push' },
      { name: 'In-App Purchase Offer', segment: 'Active players', message: 'Hi {{first_name}}, get 20% off on your next in-app purchase!', channel: 'Email' },
      { name: 'Daily Login Reward', segment: 'Users who logged in today', message: 'Claim your daily reward, {{first_name}}!', channel: 'Push' },
      { name: 'Friend Invite', segment: 'All users', message: 'Invite friends and earn rewards, {{first_name}}!', channel: 'WhatsApp' },
      { name: 'Event Participation', segment: 'Users who joined an event', message: 'Thanks for joining the event, {{first_name}}! Here’s a bonus for you.', channel: 'SMS' }
    ],
    healthcare: [
      { name: 'Appointment Reminder', segment: 'Users with upcoming appointments', message: 'Hi {{first_name}}, your appointment with Dr. {{doctor_name}} is scheduled for {{date}}.', channel: 'SMS' },
      { name: 'Health Tips', segment: 'All users', message: 'Stay healthy, {{first_name}}! Here are some tips for you.', channel: 'Email' },
      { name: 'Prescription Refill', segment: 'Users with expiring prescriptions', message: 'Hi {{first_name}}, it’s time to refill your prescription for {{medication}}.', channel: 'Push' },
      { name: 'Lab Report Ready', segment: 'Users with completed lab tests', message: 'Hi {{first_name}}, your lab report is now available.', channel: 'Email' },
      { name: 'Vaccination Reminder', segment: 'Users due for vaccination', message: 'Hi {{first_name}}, your vaccination is due on {{date}}.', channel: 'SMS' }
    ],
    media: [
      { name: 'New Episode Alert', segment: 'Users who watched previous episodes', message: 'Hi {{first_name}}, a new episode of {{show_name}} is now streaming!', channel: 'Push' },
      { name: 'Subscription Expiry', segment: 'Users with expiring subscriptions', message: 'Hi {{first_name}}, renew your subscription to keep watching.', channel: 'Email' },
      { name: 'Watchlist Reminder', segment: 'Users with items in watchlist', message: 'Hi {{first_name}}, your watchlist is waiting for you!', channel: 'Push' },
      { name: 'Feedback Request', segment: 'Users who finished a show', message: 'Hi {{first_name}}, how did you like {{show_name}}? Share your feedback.', channel: 'SMS' },
      { name: 'Trending Now', segment: 'All users', message: 'Check out what’s trending now, {{first_name}}!', channel: 'Push' }
    ],
    saas: [
      { name: 'Trial Expiry', segment: 'Users with expiring trials', message: 'Hi {{first_name}}, your free trial ends soon. Upgrade now!', channel: 'Email' },
      { name: 'Feature Update', segment: 'All users', message: 'Hi {{first_name}}, check out new features in your dashboard.', channel: 'Push' },
      { name: 'Usage Alert', segment: 'Users nearing usage limits', message: 'Hi {{first_name}}, you are nearing your usage limit.', channel: 'Email' },
      { name: 'Renewal Reminder', segment: 'Users with upcoming renewals', message: 'Hi {{first_name}}, your subscription is due for renewal.', channel: 'SMS' },
      { name: 'Onboarding Help', segment: 'New users', message: 'Welcome {{first_name}}! Need help getting started? Contact us anytime.', channel: 'WhatsApp' }
    ],
    realestate: [
      { name: 'New Property Alert', segment: 'Users searching for properties', message: 'Hi {{first_name}}, new properties matching your criteria are available.', channel: 'Push' },
      { name: 'Site Visit Reminder', segment: 'Users scheduled for site visits', message: 'Hi {{first_name}}, your site visit is scheduled for {{date}}.', channel: 'SMS' },
      { name: 'Price Drop', segment: 'Users who shortlisted properties', message: 'Hi {{first_name}}, price dropped for a property you shortlisted!', channel: 'Email' },
      { name: 'Loan Assistance', segment: 'All users', message: 'Need help with home loans, {{first_name}}? We’re here to assist.', channel: 'WhatsApp' },
      { name: 'Feedback Request', segment: 'Users who visited a property', message: 'Hi {{first_name}}, how was your site visit? Share your feedback.', channel: 'Push' }
    ],
    food: [
      { name: 'Order Reminder', segment: 'Users who added food to cart but didn’t order', message: 'Hi {{first_name}}, your delicious meal is waiting! Complete your order now.', channel: 'Push' },
      { name: 'New Restaurant', segment: 'All users', message: 'Hi {{first_name}}, try out the new restaurant in your area!', channel: 'Email' },
      { name: 'Delivery Tracking', segment: 'Users with ongoing orders', message: 'Hi {{first_name}}, your order is on the way!', channel: 'SMS' },
      { name: 'Feedback Request', segment: 'Users who received delivery', message: 'Hi {{first_name}}, how was your meal? Share your feedback.', channel: 'WhatsApp' },
      { name: 'Special Offer', segment: 'All users', message: 'Hi {{first_name}}, enjoy 20% off on your next order!', channel: 'Push' }
    ],
    fitness: [
      { name: 'Workout Reminder', segment: 'Users with scheduled workouts', message: 'Hi {{first_name}}, it’s time for your workout session!', channel: 'Push' },
      { name: 'New Class Alert', segment: 'All users', message: 'Hi {{first_name}}, check out our new fitness classes.', channel: 'Email' },
      { name: 'Goal Achievement', segment: 'Users who achieved fitness goals', message: 'Congrats {{first_name}}! You achieved your fitness goal.', channel: 'Push' },
      { name: 'Membership Renewal', segment: 'Users with expiring memberships', message: 'Hi {{first_name}}, renew your membership to keep training.', channel: 'SMS' },
      { name: 'Trainer Feedback', segment: 'Users who attended a session', message: 'Hi {{first_name}}, how was your session with {{trainer_name}}?', channel: 'WhatsApp' }
    ],
    social: [
      { name: 'Friend Suggestion', segment: 'Users with few connections', message: 'Hi {{first_name}}, connect with more friends on our platform!', channel: 'Push' },
      { name: 'Birthday Notification', segment: 'Users with friends’ birthdays', message: 'Wish your friend a happy birthday, {{first_name}}!', channel: 'Email' },
      { name: 'Event Invite', segment: 'All users', message: 'Hi {{first_name}}, you’re invited to our upcoming event.', channel: 'Push' },
      { name: 'Message Reminder', segment: 'Users with unread messages', message: 'Hi {{first_name}}, you have unread messages waiting.', channel: 'SMS' },
      { name: 'Profile Completion', segment: 'Users with incomplete profiles', message: 'Hi {{first_name}}, complete your profile to get more connections.', channel: 'Push' }
    ],
    marketplace: [
      { name: 'New Listing Alert', segment: 'Users searching for products', message: 'Hi {{first_name}}, new products matching your search are available.', channel: 'Push' },
      { name: 'Seller Offer', segment: 'Sellers with new offers', message: 'Hi {{first_name}}, you have a new offer on your product.', channel: 'Email' },
      { name: 'Order Shipped', segment: 'Buyers with shipped orders', message: 'Hi {{first_name}}, your order {{order_id}} has been shipped.', channel: 'SMS' },
      { name: 'Feedback Request', segment: 'Buyers who received delivery', message: 'Hi {{first_name}}, how was your purchase? Share your feedback.', channel: 'WhatsApp' },
      { name: 'Wishlist Reminder', segment: 'Users with items in wishlist', message: 'Hi {{first_name}}, items in your wishlist are waiting for you!', channel: 'Push' }
    ],
    automotive: [
      { name: 'Service Reminder', segment: 'Users with upcoming service', message: 'Hi {{first_name}}, your vehicle service is due on {{date}}.', channel: 'SMS' },
      { name: 'Test Drive Offer', segment: 'Users interested in new models', message: 'Hi {{first_name}}, book a test drive for the new {{model_name}}.', channel: 'Push' },
      { name: 'Insurance Renewal', segment: 'Users with expiring insurance', message: 'Hi {{first_name}}, renew your vehicle insurance to stay protected.', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who completed a service', message: 'Hi {{first_name}}, how was your service experience?', channel: 'WhatsApp' },
      { name: 'New Launch', segment: 'All users', message: 'Hi {{first_name}}, check out our latest vehicle launch!', channel: 'Push' }
    ],
    logistics: [
      { name: 'Shipment Update', segment: 'Users with active shipments', message: 'Hi {{first_name}}, your shipment {{shipment_id}} is in transit.', channel: 'SMS' },
      { name: 'Delivery Confirmation', segment: 'Users with delivered shipments', message: 'Hi {{first_name}}, your shipment {{shipment_id}} has been delivered.', channel: 'Push' },
      { name: 'Pickup Reminder', segment: 'Users scheduled for pickup', message: 'Hi {{first_name}}, your pickup is scheduled for {{date}}.', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who received delivery', message: 'Hi {{first_name}}, how was your delivery experience?', channel: 'WhatsApp' },
      { name: 'Delay Notification', segment: 'Users with delayed shipments', message: 'Hi {{first_name}}, your shipment is delayed. We apologize for the inconvenience.', channel: 'Push' }
    ],
    entertainment: [
      { name: 'Event Reminder', segment: 'Users registered for events', message: 'Hi {{first_name}}, your event {{event_name}} is coming up soon!', channel: 'Push' },
      { name: 'Ticket Offer', segment: 'Users who viewed events', message: 'Hi {{first_name}}, get 10% off on tickets for {{event_name}}.', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who attended an event', message: 'Hi {{first_name}}, how was your experience at {{event_name}}?', channel: 'SMS' },
      { name: 'New Event Launch', segment: 'All users', message: 'Hi {{first_name}}, check out our new events this month!', channel: 'Push' },
      { name: 'Personalized Recommendation', segment: 'Users with past attendance', message: 'Hi {{first_name}}, you might like these upcoming events.', channel: 'WhatsApp' }
    ],
    education: [
      { name: 'Exam Reminder', segment: 'Students with upcoming exams', message: 'Hi {{first_name}}, your exam for {{subject}} is scheduled for {{date}}.', channel: 'SMS' },
      { name: 'New Course Alert', segment: 'All students', message: 'Hi {{first_name}}, check out our new course: {{course_name}}.', channel: 'Email' },
      { name: 'Assignment Due', segment: 'Students with pending assignments', message: 'Hi {{first_name}}, your assignment for {{subject}} is due soon.', channel: 'Push' },
      { name: 'Result Announcement', segment: 'Students who appeared for exams', message: 'Hi {{first_name}}, your results for {{subject}} are out now.', channel: 'Push' },
      { name: 'Parent Meeting', segment: 'Parents of students', message: 'Hi {{first_name}}, parent-teacher meeting is scheduled for {{date}}.', channel: 'WhatsApp' }
    ],
    insurance: [
      { name: 'Policy Renewal', segment: 'Users with expiring policies', message: 'Hi {{first_name}}, your insurance policy is due for renewal.', channel: 'Email' },
      { name: 'Premium Payment Reminder', segment: 'Users with upcoming premium', message: 'Hi {{first_name}}, your premium payment is due on {{date}}.', channel: 'SMS' },
      { name: 'Claim Assistance', segment: 'Users who filed a claim', message: 'Hi {{first_name}}, need help with your claim? Contact us anytime.', channel: 'WhatsApp' },
      { name: 'New Policy Offer', segment: 'All users', message: 'Hi {{first_name}}, check out our new insurance plans.', channel: 'Push' },
      { name: 'Feedback Request', segment: 'Users who renewed policy', message: 'Hi {{first_name}}, how was your renewal experience?', channel: 'Push' }
    ],
    hospitality: [
      { name: 'Booking Confirmation', segment: 'Users with confirmed bookings', message: 'Hi {{first_name}}, your booking at {{hotel_name}} is confirmed.', channel: 'SMS' },
      { name: 'Check-in Reminder', segment: 'Users with upcoming stays', message: 'Hi {{first_name}}, check-in for your stay at {{hotel_name}} is tomorrow.', channel: 'Push' },
      { name: 'Special Offer', segment: 'All users', message: 'Hi {{first_name}}, enjoy 15% off on your next stay!', channel: 'Email' },
      { name: 'Feedback Request', segment: 'Users who completed a stay', message: 'Hi {{first_name}}, how was your stay at {{hotel_name}}?', channel: 'WhatsApp' },
      { name: 'Loyalty Program', segment: 'Frequent guests', message: 'Hi {{first_name}}, join our loyalty program for exclusive benefits.', channel: 'Push' }
    ],
    telecom: [
      { name: 'Recharge Reminder', segment: 'Users with expiring plans', message: 'Hi {{first_name}}, your plan expires soon. Recharge now!', channel: 'SMS' },
      { name: 'New Plan Launch', segment: 'All users', message: 'Hi {{first_name}}, check out our new plans for you.', channel: 'Email' },
      { name: 'Usage Alert', segment: 'Users nearing data limit', message: 'Hi {{first_name}}, you are nearing your data limit.', channel: 'Push' },
      { name: 'Bill Payment Confirmation', segment: 'Users who paid bill', message: 'Hi {{first_name}}, your bill payment is successful.', channel: 'WhatsApp' },
      { name: 'Feedback Request', segment: 'Users who recharged', message: 'Hi {{first_name}}, how was your recharge experience?', channel: 'Push' }
    ],
    retail: [
      { name: 'New Collection Launch', segment: 'All users', message: 'Hi {{first_name}}, check out our new collection in stores now!', channel: 'Push' },
      { name: 'Sale Alert', segment: 'All users', message: 'Hi {{first_name}}, our biggest sale of the year is live!', channel: 'Email' },
      { name: 'Loyalty Points Update', segment: 'Loyalty program members', message: 'Hi {{first_name}}, you have {{points}} loyalty points.', channel: 'Push' },
      { name: 'Birthday Offer', segment: 'Users with birthday this month', message: 'Happy Birthday {{first_name}}! Enjoy a special discount.', channel: 'SMS' },
      { name: 'Feedback Request', segment: 'Users who made a purchase', message: 'Hi {{first_name}}, how was your shopping experience?', channel: 'WhatsApp' }
    ]
  };

  // Update usecases when vertical or AI is toggled
  useEffect(() => {
    setAiError('');
    if (aiUsecasesByVertical.current[vertical]) {
      setUsecases(aiUsecasesByVertical.current[vertical]);
    } else {
      setUsecases(staticUsecases[vertical] || []);
    }
  }, [vertical]);

  const fetchAiUsecases = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const resp = await axios.post('/ai-usecases', { vertical });
      if (resp.data.usecases && Array.isArray(resp.data.usecases)) {
        aiUsecasesByVertical.current[vertical] = resp.data.usecases;
        setUsecases(resp.data.usecases);
        localStorage.setItem('aiUsecasesByVertical', JSON.stringify(aiUsecasesByVertical.current));
      } else {
        setAiError('AI did not return valid usecases.');
      }
    } catch (e) {
      setAiError('Failed to fetch AI usecases.');
    }
    setAiLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post('/recommend', {
        appUrl,
        vertical,
        goals: goals.split(',').map(g => g.trim()).filter(Boolean)
      });
      setResult(response.data);
      localStorage.setItem('sampleDataDesignResult', JSON.stringify(response.data));
    } catch (err) {
      setResult({ error: 'Failed to get recommendations' });
    }
    setLoading(false);
  };

  const handleDownloadExcel = () => {
    if (!result) return;
    // Prepare data for Excel
    const userAttrSheet = [
      ['Name', 'Type', 'Example'],
      ...result.userAttributes.map(attr => [attr.name, attr.type, attr.example || (attr.type === 'string' ? 'john.doe@example.com' : attr.type === 'date' ? '2023-01-01' : '123')])
    ];
    const eventsSheet = [
      ['Name', 'Properties'],
      ...result.events.map(evt => [evt.name, evt.properties.map(prop => {
        const name = typeof prop === 'object' ? prop.name : prop;
        const type = typeof prop === 'object' && prop.type ? prop.type : 'string';
        let example = 'example';
        if (typeof prop === 'object' && prop.example) example = prop.example;
        else if (type === 'string') example = name + '_value';
        else if (type === 'number') example = '123';
        else if (type === 'date') example = '2023-01-01';
        return `${name} (${type}, ${example})`;
      }).join(', ')])
    ];
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(userAttrSheet);
    const ws2 = XLSX.utils.aoa_to_sheet(eventsSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'User Attributes');
    XLSX.utils.book_append_sheet(wb, ws2, 'Events');
    // Write and trigger download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'recommendations.xlsx');
  };

  const handleDownloadUsecases = () => {
    if (!usecases || usecases.length === 0) return;
    const sheet = [
      ['Name of Usecase', 'Segment/Cohort', 'Sample Messaging (with Personalisation)', 'Channel'],
      ...usecases.map(uc => [
        uc.name,
        uc.segment,
        typeof uc.message === 'object' && uc.message !== null
          ? Object.entries(uc.message).map(([ch, msg]) => `${ch}: ${msg}`).join('\n')
          : uc.message,
        Array.isArray(uc.channel) ? uc.channel.join(', ') : uc.channel
      ])
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheet);
    XLSX.utils.book_append_sheet(wb, ws, 'Usecases');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'usecases.xlsx');
  };

  return (
    <div className="App split-layout">
      <div className="split-left">
        <img src={logo} alt="MoEngage Logo" style={{height: 40, marginBottom: 32}} />
        <h2>Data & Usecase Designer (Powered by Gemini)</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Client App Link: </label>
            <input ref={urlInputRef} value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://clientapp.com" required />
          </div>
          <div>
            <label>Business Vertical: </label>
            <select value={vertical} onChange={e => setVertical(e.target.value)}>
              <option value="ecommerce">Ecommerce</option>
              <option value="fintech">Fintech</option>
              <option value="travel">Travel</option>
              <option value="edtech">EdTech</option>
              <option value="gaming">Gaming</option>
              <option value="healthcare">Healthcare</option>
              <option value="media">Media</option>
              <option value="saas">SaaS</option>
              <option value="realestate">RealEstate</option>
              <option value="food">Food</option>
              <option value="fitness">Fitness</option>
              <option value="social">Social</option>
              <option value="marketplace">Marketplace</option>
              <option value="automotive">Automotive</option>
              <option value="logistics">Logistics</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="insurance">Insurance</option>
              <option value="hospitality">Hospitality</option>
              <option value="telecom">Telecom</option>
              <option value="retail">Retail</option>
            </select>
          </div>
          <div>
            <label>Business Goals (comma separated, optional): </label>
            <input value={goals} onChange={e => setGoals(e.target.value)} placeholder="Increase conversions, Reduce churn" />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Get Recommendations'}</button>
        </form>
        {result && result.error && <div style={{color:'red'}}>{result.error}</div>}
        {result && result.fallback && (
          <div style={{color:'#b26a00', background:'#fffbe6', border:'1px solid #ffe58f', padding:'10px 16px', borderRadius:6, marginTop:12, marginBottom:12}}>
            Showing fallback recommendations (Gemini AI was not used).
          </div>
        )}
      </div>
      <div className="split-right">
        <div style={{display:'flex', borderBottom:'1.5px solid #e3e7ed', marginBottom:24}}>
          <button onClick={()=>setActiveTab('recommendations')} className={activeTab==='recommendations' ? 'active-tab' : ''} style={{border:'none', background:'none', fontWeight:600, fontSize:18, color:activeTab==='recommendations'?'#0052cc':'#888', padding:'12px 24px', borderBottom:activeTab==='recommendations'?'3px solid #0052cc':'none', cursor:'pointer'}}>Sample Data Design</button>
          <button onClick={()=>setActiveTab('usecases')} className={activeTab==='usecases' ? 'active-tab' : ''} style={{border:'none', background:'none', fontWeight:600, fontSize:18, color:activeTab==='usecases'?'#0052cc':'#888', padding:'12px 24px', borderBottom:activeTab==='usecases'?'3px solid #0052cc':'none', cursor:'pointer'}}>Sample Usecases</button>
        </div>
        {activeTab==='recommendations' && result && !result.error && (
          <div style={{marginTop: 0, position: 'relative'}}>
            {result.goals && result.goals.length > 0 && result.goals.some(g => (typeof g === 'string' && g.trim()) || (typeof g === 'object' && g && (g.goal || g.name || JSON.stringify(g).trim() !== '{}'))) && (
              <div style={{marginBottom: 18}}>
                <h4 style={{margin:'0 0 6px 0'}}>Business Goals Considered:</h4>
                <ul style={{marginTop:0}}>
                  {result.goals.map((g, i) => (
                    <li key={i}>
                      {typeof g === 'object' && g !== null ?
                        (g.goal || g.name || g.description || JSON.stringify(g)) :
                        String(g)
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Sample User Attributes</h3>
              <button className="download-btn" onClick={handleDownloadExcel} style={{position: 'static', float: 'none', minWidth: 180}}>
                Download as Excel
              </button>
            </div>
            <table border="1" cellPadding="6">
              <thead>
                <tr><th>Name</th><th>Type</th><th>Example</th></tr>
              </thead>
              <tbody>
                {result.userAttributes.map((attr, i) => (
                  <tr key={i}>
                    <td>{typeof attr === 'object' ? attr.name : String(attr)}</td>
                    <td>{typeof attr === 'object' ? attr.type : ''}</td>
                    <td>{typeof attr === 'object' ? (
                      attr.example !== undefined && attr.example !== null && attr.example !== ''
                        ? (attr.type === 'date' || attr.type === 'datetime' ?
                            (typeof attr.example === 'string' && attr.example.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
                              ? attr.example
                              : '2023-01-01T12:00:00Z')
                          : attr.type === 'boolean' ?
                            (typeof attr.example === 'boolean' ? attr.example.toString() : 'true')
                          : attr.example)
                        : (attr.type === 'date' || attr.type === 'datetime' ? '2023-01-01T12:00:00Z'
                          : attr.type === 'boolean' ? 'true'
                          : attr.type === 'number' ? '123'
                          : attr.type === 'string' ? attr.name + '_value'
                          : 'sample')
                    ) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Sample Events</h3>
            <table border="1" cellPadding="6" style={{width:'100%', tableLayout:'fixed'}}>
              <thead>
                <tr style={{background:'#f0f3f7'}}>
                  <th style={{fontWeight:500, color:'#1a2330', fontSize:'0.97rem', padding:'8px 6px', width:'40%'}}>Attribute</th>
                  <th style={{fontWeight:500, color:'#1a2330', fontSize:'0.97rem', padding:'8px 6px', width:'60%'}}>Properties</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((evt, i) => (
                  <tr key={i}>
                    <td style={{verticalAlign:'top', fontWeight:600, color:'#0052cc', background:'#f7fafd', minWidth:140, width:'180px'}}>{typeof evt === 'object' ? evt.name : String(evt)}</td>
                    <td style={{padding:0, background:'#fff'}}>
                      <table style={{width:'100%', background:'none', border:'none', borderCollapse:'collapse', borderSpacing:0, margin:0, tableLayout:'fixed'}}>
                        <thead>
                          <tr style={{background:'#f0f3f7'}}>
                            <th style={{fontWeight:500, color:'#1a2330', fontSize:'0.97rem', padding:'8px 6px', width:'33%'}}>Attribute</th>
                            <th style={{fontWeight:500, color:'#1a2330', fontSize:'0.97rem', padding:'8px 6px', width:'33%'}}>Type</th>
                            <th style={{fontWeight:500, color:'#1a2330', fontSize:'0.97rem', padding:'8px 6px', width:'34%'}}>Sample Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(evt.properties || []).map((prop, j) => {
                            if (typeof prop === 'object' && prop !== null && 'name' in prop) {
                              let example = prop.example;
                              if (example === undefined || example === null || example === '') {
                                if (prop.type === 'date' || prop.type === 'datetime') {
                                  example = '2023-01-01T12:00:00Z';
                                } else if (prop.type === 'boolean') {
                                  example = 'true';
                                } else if (prop.type === 'number') {
                                  example = '123';
                                } else if (prop.type === 'string') {
                                  example = prop.name + '_value';
                                } else {
                                  example = 'sample';
                                }
                              } else if ((prop.type === 'date' || prop.type === 'datetime') && typeof example === 'string' && !example.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)) {
                                example = '2023-01-01T12:00:00Z';
                              } else if (prop.type === 'boolean' && typeof example !== 'string') {
                                example = example.toString();
                              }
                              return (
                                <tr key={j} style={{background: j%2===0 ? '#f7fafd' : '#fff'}}>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{prop.name}</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{prop.type || 'string'}</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{example}</td>
                                </tr>
                              );
                            } else if (typeof prop === 'object' && prop !== null && Array.isArray(prop)) {
                              return (
                                <tr key={j} style={{background: j%2===0 ? '#f7fafd' : '#fff'}}>
                                  <td colSpan={3} style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{JSON.stringify(prop)}</td>
                                </tr>
                              );
                            } else if (typeof prop === 'object' && prop !== null && 'name' in prop && 'description' in prop) {
                              return (
                                <tr key={j} style={{background: j%2===0 ? '#f7fafd' : '#fff'}}>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{prop.name}</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>string</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{prop.description}</td>
                                </tr>
                              );
                            } else {
                              return (
                                <tr key={j} style={{background: j%2===0 ? '#f7fafd' : '#fff'}}>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{String(prop)}</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>string</td>
                                  <td style={{padding:'8px 6px', border:'none', wordBreak:'break-word'}}>{String(prop) + '_value'}</td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab==='usecases' && (
          <div style={{marginTop:0}}>
            <h3>Sample Marketing Usecases</h3>
            <button onClick={fetchAiUsecases} disabled={aiLoading} style={{marginBottom:16, float:'right', background:'#00b1f2', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', fontWeight:600, cursor:'pointer', minWidth:240, height:44}}>
              {aiLoading ? <span style={{opacity:0.8}}>Getting AI Usecases...</span> : 'Get AI-Recommended Usecases'}
            </button>
            <button onClick={handleDownloadUsecases} style={{marginBottom:16, float:'right', marginRight:12, background:'#0052cc', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', fontWeight:600, cursor:'pointer'}}>
              Download Usecases
            </button>
            {aiError && <div style={{color:'red', marginBottom:12, clear:'both'}}>{aiError}</div>}
            <table border="1" cellPadding="6" style={{marginTop:12, width:'100%'}}>
              <thead>
                <tr>
                  <th>Name of Usecase</th>
                  <th>Segment/Cohort</th>
                  <th>Sample Messaging (with Personalisation)</th>
                  <th>Channel</th>
                </tr>
              </thead>
              <tbody>
                {usecases.map((uc, i) => (
                  <tr key={i}>
                    <td>{uc.name}</td>
                    <td>{uc.segment}</td>
                    <td>
                      {typeof uc.message === 'object' && uc.message !== null
                        ? Object.entries(uc.message).map(([ch, msg]) => (
                            <div key={ch}><b>{ch}:</b> {msg}</div>
                          ))
                        : uc.message}
                    </td>
                    <td>
                      {Array.isArray(uc.channel)
                        ? uc.channel.join(', ')
                        : uc.channel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
