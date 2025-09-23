# System Settings - Assets & Departments Management

A React-based system settings interface with a new "Assets & Departments" tab for managing organizational departments and assets.

## Features

### System Settings Tabs
- **General**: General system configuration (placeholder)
- **SLA**: Service Level Agreement settings (placeholder)
- **Assets & Departments**: New tab for managing departments and assets

### Assets & Departments Management

#### Departments Management
- ✅ Create new departments with code, name, description, sort order, and suffix number
- ✅ View all departments in a paginated table
- ✅ Search departments by code
- ✅ Real-time API integration with your backend endpoints

#### Assets Management
- ✅ Create new assets with code, name, serial number, and department assignment
- ✅ View all assets in a table format
- ✅ Search assets by code
- ✅ Department dropdown populated from existing departments
- ✅ Real-time API integration with your backend endpoints

## API Integration

The application integrates with your existing API endpoints:

### Department Endpoints
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments` - Get all departments (with pagination)
- `GET /api/v1/departments/code/{code}` - Get department by code

### Asset Endpoints
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/all` - Get all assets
- `GET /api/v1/assets/code/{code}` - Get asset by code

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn
- Your backend API running on `http://localhost:8080`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage Guide

### Adding a New Department

1. Navigate to **System Settings** → **Assets & Departments** tab
2. Click on the **Departments** sub-tab
3. Click the **"Add Department"** button
4. Fill in the form:
   - **Department Code**: Unique identifier (e.g., "23910")
   - **Department Name**: Display name (e.g., "Laptop Services")
   - **Description**: Detailed description
   - **Sort Order**: Numeric order for sorting
   - **Suffix Number**: Numeric suffix
5. Click **"Create Department"**

### Adding a New Asset

1. Navigate to **System Settings** → **Assets & Departments** tab
2. Click on the **Assets** sub-tab
3. Click the **"Add Asset"** button
4. Fill in the form:
   - **Asset Code**: Unique identifier (e.g., "1232")
   - **Asset Name**: Display name (e.g., "HP")
   - **Serial Number**: Asset serial number (e.g., "3748")
   - **Department**: Select from existing departments
5. Click **"Create Asset"**

### Searching

- **Departments**: Use the search box to find departments by code
- **Assets**: Use the search box to find assets by code
- Click **"Clear"** to reset search and show all items

## File Structure

```
src/
├── components/
│   ├── SystemSettings.tsx              # Main settings component with tabs
│   └── tabs/
│       ├── GeneralSettings.tsx         # General settings (placeholder)
│       ├── SLASettings.tsx            # SLA settings (placeholder)
│       ├── AssetsDepartmentsSettings.tsx # Assets & Departments main component
│       ├── DepartmentsManagement.tsx   # Departments CRUD interface
│       └── AssetsManagement.tsx        # Assets CRUD interface
├── services/
│   └── api.ts                         # API service with all endpoints
├── App.tsx                            # Main app component
└── index.tsx                          # App entry point
```

## API Service Configuration

The API service is configured in `src/services/api.ts`:

- **Base URL**: `http://localhost:8080/api/v1`
- **Headers**: Content-Type: application/json, Accept: */*
- **Error Handling**: Built-in error handling with user-friendly messages

## Customization

### Changing API Base URL
Update the `API_BASE_URL` constant in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://your-api-server:port/api/v1';
```

### Adding New Fields
To add new fields to departments or assets:

1. Update the interfaces in `src/services/api.ts`
2. Add form fields in the respective management components
3. Update the table columns to display new data

### Styling
The application uses Material-UI components. You can customize the theme in `src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
    // Add more customizations
  },
});
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure your backend is running on `http://localhost:8080`
   - Check CORS settings on your backend
   - Verify API endpoints are accessible

2. **Department Dropdown Empty**
   - Ensure departments are created before adding assets
   - Check if the departments API is returning data

3. **Search Not Working**
   - Verify the search code exists in the system
   - Check browser console for API errors

### Development Tips

- Use browser developer tools to monitor API calls
- Check the Network tab for failed requests
- Review console logs for JavaScript errors

## Next Steps

This implementation provides a solid foundation. You can extend it by:

1. **Adding Edit/Delete functionality** for departments and assets
2. **Implementing pagination** for large datasets
3. **Adding data validation** and form validation
4. **Creating bulk operations** for importing/exporting data
5. **Adding user permissions** and role-based access
6. **Implementing real-time updates** using WebSockets

## Support

For issues or questions, check the browser console for error messages and ensure your backend API is running and accessible.