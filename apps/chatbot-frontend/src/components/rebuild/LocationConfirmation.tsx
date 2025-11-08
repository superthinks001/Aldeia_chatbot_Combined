import React, { useState } from 'react';
import { MessageCircle, Home, Search } from 'lucide-react';
import './LocationConfirmation.css';

interface LocationConfirmationProps {
  onBack: () => void;
  onNext: (data: PropertyData) => void;
}

interface PropertyData {
  address: string;
  parcelNumber: string;
  damage: string;
  yearBuilt: string;
  useType: string;
  builtArea: string;
  lotArea: string;
  beds: string;
  bath: string;
  detachedUnit: string;
  cornerLot: string;
  totalValue: string;
  landValue: string;
}

const LocationConfirmation: React.FC<LocationConfirmationProps> = ({ onBack, onNext }) => {
  const [searchAddress, setSearchAddress] = useState('2743 SANTA ROSA AVE ALTADENA CA 91001-1940');

  // Mock property data - in real app, this would be fetched from API
  const [propertyData] = useState<PropertyData>({
    address: '2743 SANTA ROSA AVE ALTADENA CA 91001-1940',
    parcelNumber: '5841-028-018',
    damage: 'Destroyed (>50%)',
    yearBuilt: '1946',
    useType: 'Single Family Residential',
    builtArea: '884',
    lotArea: '7,475',
    beds: '01',
    bath: '01',
    detachedUnit: '0',
    cornerLot: 'N',
    totalValue: '$497,510',
    landValue: '$432,086'
  });

  const handleNext = () => {
    onNext(propertyData);
  };

  return (
    <div className="location-confirmation">
      {/* Header */}
      <header className="rebuild-header">
        <div className="logo">
          <div className="logo-icon">🔥</div>
          <span className="logo-text">aldeia</span>
        </div>
        <a href="#" className="home-link">HOME</a>
      </header>

      <div className="location-content">
        {/* Left Section */}
        <div className="location-left">
          <h1 className="location-title">
            Is this the right rebuild location and property?
          </h1>

          <ul className="location-instructions">
            <li>If not, then enter the correct address.</li>
            <li>Review the details of your rebuild location.</li>
            <li>Click next to confirm and move forward.</li>
          </ul>

          <div className="login-prompt">
            <p>Already a member?</p>
            <a href="#" className="login-link">Log in</a>
          </div>
        </div>

        {/* Right Section */}
        <div className="location-right">
          {/* Search Bar */}
          <div className="address-search">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Rebuild location address..."
            />
          </div>

          {/* Property Images */}
          <div className="property-images">
            <div className="property-image-card">
              <img src="/api/placeholder/400/300" alt="Property aerial view before" />
            </div>
            <div className="property-image-card">
              <img src="/api/placeholder/400/300" alt="Property aerial view after" />
            </div>
          </div>

          <p className="image-attribution">
            Images and property details provided by Google Maps, ESRI, County Assessor and Permit Viewer.
          </p>

          {/* Property Details */}
          <div className="property-details">
            <h2 className="property-address">{propertyData.address}</h2>

            <div className="details-grid">
              <div className="detail-row">
                <div className="detail-item">
                  <label>Parcel Number (APN)</label>
                  <value>{propertyData.parcelNumber}</value>
                </div>
                <div className="detail-item">
                  <label>Damage</label>
                  <value>{propertyData.damage}</value>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Year Built</label>
                  <value>{propertyData.yearBuilt}</value>
                </div>
                <div className="detail-item">
                  <label>Use Type</label>
                  <value>{propertyData.useType}</value>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Built Area (Square Feet)</label>
                  <value>{propertyData.builtArea}</value>
                </div>
                <div className="detail-item">
                  <label>Lot Area (Square Feet)</label>
                  <value>{propertyData.lotArea}</value>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Beds</label>
                  <value>{propertyData.beds}</value>
                </div>
                <div className="detail-item">
                  <label>Bath</label>
                  <value>{propertyData.bath}</value>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Detached Unit (Square Feet)</label>
                  <value>{propertyData.detachedUnit}</value>
                </div>
                <div className="detail-item">
                  <label>Corner Lot</label>
                  <value>{propertyData.cornerLot}</value>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <label>Total Value</label>
                  <value>{propertyData.totalValue}</value>
                </div>
                <div className="detail-item">
                  <label>Land Value</label>
                  <value>{propertyData.landValue}</value>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="location-nav">
        <button className="nav-btn nav-btn-back" onClick={onBack}>
          &lt;&lt; BACK
        </button>
        <button className="nav-btn nav-btn-next" onClick={handleNext}>
          NEXT &gt;&gt;
        </button>
      </div>

      {/* Chatbot Icon */}
      <div className="chatbot-icon">
        <MessageCircle />
      </div>
    </div>
  );
};

export default LocationConfirmation;
