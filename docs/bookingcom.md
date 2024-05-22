---
title: Booking.com
description: Import properties from Booking.com
order: 5
---
## **Connect** [**Booking.com**](http://Booking.com) **with PrimeHost & reply faster than ever!**

In order to provide conversation-only information from [Booking.com](http://Booking.com) via emails we need to forward the emails that come from [mchat.booking.com](http://mchat.booking.com) (conversations only) to [cohost@primehost.ai](mailto:cohost@primehost.ai)

## **Using a Google workspace account:**

1.  [https://admin.google.com/ac/apps/gmail/compliance](https://admin.google.com/ac/apps/gmail/compliance)
    
2.  Go to Content compliance and select Configure (or add another rule if you already have rules)
    

**Select Inbound**

1.  Click Add in the Expressions tab
    
2.  Select Advanced content match from the dropdown
    
3.  Location → Sender Header
    
4.  Content → [mchat.booking.com](http://mchat.booking.com) 
    
5.  Click SAVE
    

<img src="/docs/media/Screenshot 2024-05-21 at 12.35.03 PM.png" alt="Screenshot" style="margin: 20px; width: 80%; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">

**Click Also deliver to → Add more recipients and add** [**cohost@primehost.ai**](mailto:cohost@primehost.ai)

**Add a description for your rule e.g bcc com** [**primehost.ai**](http://primehost.ai)

## **Using Gmail Account**

To forward Gmail emails that come from any address ending with @[mchat.booking.com](http://mchat.booking.com) to [cohost@primehost.ai](mailto:cohost@primehost.ai), you can set up a filter in Gmail. Follow this step-by-step guide:

**Open Gmail and Go to Settings:**

1.  Open your Gmail account.
    
2.  Click the gear icon in the upper right corner to open the Settings menu.
    
3.  Select "See all settings" from the dropdown.
    

**Create a new Filter:**

1.  In the settings, go to the "Filters and Blocked Addresses" tab.
    
2.  Click on "Create a new filter" at the bottom.
    

**Set Up the Filter Criteria:**

1.  In the "From" field, enter \*@[mchat.booking.com](http://mchat.booking.com).
    
2.  Click on "Create filter" at the bottom right corner of the filter box.
    

**Set Up the Filter Actions:**

1.  Check the box next to "Forward it to".
    
2.  Enter the email address [cohost@primehost.ai](mailto:cohost@primehost.ai).
    
3.  If you haven't already set up this forwarding address, Gmail will send a verification code to [cohost@primehost.ai](mailto:cohost@primehost.ai). You will need to enter this code in the settings to verify the forwarding address.
    
4.  Optionally, you can also check other options such as "Apply the label", "Never send it to Spam", etc., if needed.
    

**Create the Filter:**

Click "Create filter".

**Verify the Forwarding Address:**

If you haven't verified the forwarding address yet, follow these steps:

1.  Go to the "Forwarding and POP/IMAP" tab in Settings.
    
2.  Click on "Add a forwarding address".
    
3.  Enter [cohost@primehost.ai](mailto:cohost@primehost.ai) and click "Next", then "Proceed" in the pop-up window.
    
4.  Check the [cohost@primehost.ai](mailto:cohost@primehost.ai) inbox for the verification email from Gmail.
    
5.  Open the verification email and click on the verification link or enter the verification code in the Gmail settings under "Forwarding and POP/IMAP".
    

**Finalize the Filter:**

Once the forwarding address is verified, repeat the steps to create the filter and ensure that the forwarding address [cohost@primehost.ai](mailto:cohost@primehost.ai) is selected as the forwarding action.

By following these steps, all incoming emails from any address ending with @[mchat.booking.com](http://mchat.booking.com) will be automatically forwarded to [cohost@primehost.ai](mailto:cohost@primehost.ai).

## **Using Office 365**

Go to [https://admin.exchange.microsoft.com/#/transportrules](https://admin.exchange.microsoft.com/#/transportrules)

**Add a rule:**

1.  Apply this rule if: The sender address matches [mchat.booking.com](http://mchat.booking.com)
    
2.  Do the following: Add recipients to the Bcc box: [cohost@primehost.ai](mailto:cohost@primehost.ai)
    
3.  Define any time period you wish to activate the rule for
    
4.  Click Finish and ensure the rule is activated
    

<img src="/docs/media/Screenshot 2024-05-21 at 12.39.52 PM.png" alt="Screenshot" style="margin: 20px; width: 80%; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">