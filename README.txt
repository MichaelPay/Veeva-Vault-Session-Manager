# Veeva Vault Session Manager

The Veeva Vault Session Manager is a Chrome extension designed to help users manage their Veeva Vault sessions by displaying cookie, session, and user information directly within the browser.

## Features

- **Session Management**: Access and manage Veeva Vault session cookies.
- **User Information**: Display user ID and username extracted from session data.
- **Instance Information**: Retrieve and display the instance ID from `veevaUserSsoSettings` cookies.
- **Local Processing**: All data processing and display occur locally within your browser, ensuring privacy and security.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/michaelpay/Veeva-Vault-Session-Manager.git
    ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle switch in the top right corner.
4. Click "Load unpacked" and select the cloned repository folder.

## Usage

1. Click on the Veeva Vault Session Manager icon in the Chrome toolbar.
2. Select a session from the dropdown to view details such as URL, Instance ID, and Session ID.
3. Use the provided buttons to copy information to the clipboard or open the URL in a new tab.
4. Refresh or delete sessions using the respective buttons.

## Permissions

The extension requires the following permissions to function correctly:
- **Cookies Permission**: To access and read specific cookies associated with your Veeva Vault sessions.
- **Tabs Permission**: To query open tabs for Veeva Vault domains to retrieve session storage data.
- **Host Permissions**: Access to `https://*.veevavault.com/*` to read session storage and interact with Veeva Vault pages.

## Security

The extension prioritizes the security of your data by:
- Processing all data locally within your browser.
- Not transmitting any data over the internet.
- Using standard Chrome extension security practices to prevent unauthorized access.

## Privacy Policy

For detailed information on how the extension handles user data, please refer to the [Privacy Policy](https://github.com/michaelpay/Veeva-Vault-Session-Manager/privacy_policy.html).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or concerns about this extension, please contact us at:
- Email: service.tools@veeva.com