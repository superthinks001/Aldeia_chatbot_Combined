import React, { useState } from 'react';
import { MessageCircle, Upload, X } from 'lucide-react';
import './UserPreferencesStyle.css';

interface UserPreferencesStyleProps {
  onBack: () => void;
  onNext: (data: StyleData) => void;
  onRebuildNew: () => void;
  initialData?: Partial<StyleData>;
}

interface StyleData {
  uploadedPhotos: string[];
  architectureStyle: string;
  roofType: string;
}

const UserPreferencesStyle: React.FC<UserPreferencesStyleProps> = ({
  onBack,
  onNext,
  onRebuildNew,
  initialData
}) => {
  const [styleData, setStyleData] = useState<StyleData>({
    uploadedPhotos: initialData?.uploadedPhotos || ['/api/placeholder/600/400'],
    architectureStyle: initialData?.architectureStyle || 'Ranch',
    roofType: initialData?.roofType || 'Hip',
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // In a real app, you'd upload to a server and get back URLs
      const newPhotoUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setStyleData(prev => ({
        ...prev,
        uploadedPhotos: [...prev.uploadedPhotos, ...newPhotoUrls]
      }));
    }
  };

  const removePhoto = (index: number) => {
    setStyleData(prev => ({
      ...prev,
      uploadedPhotos: prev.uploadedPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    onNext(styleData);
  };

  return (
    <div className="preferences-style">
      {/* Header */}
      <header className="rebuild-header">
        <div className="logo">
          <div className="logo-icon">🔥</div>
          <span className="logo-text">aldeia</span>
        </div>
        <a href="#" className="home-link">HOME</a>
      </header>

      <div className="style-content">
        {/* Left Section */}
        <div className="style-left">
          <h1 className="style-title">
            Would you like to rebuild same as the original style?
          </h1>

          <p className="style-description">
            Upload a couple of photos of your pre-damage home's exterior view.
          </p>

          <p className="style-or">
            Or click <strong>"Rebuild Something New"</strong> to skip.
          </p>
        </div>

        {/* Right Section */}
        <div className="style-right">
          <div className="property-address">
            2743 SANTA ROSA AVE ALTADENA CA 91001-1940
          </div>

          {/* Photo Upload Area */}
          <div className="photo-upload-section">
            {styleData.uploadedPhotos.length > 0 && (
              <div className="uploaded-photo">
                <img src={styleData.uploadedPhotos[0]} alt="Uploaded home" />
                <button
                  className="remove-photo-btn"
                  onClick={() => removePhoto(0)}
                >
                  <X />
                </button>
              </div>
            )}

            <div className="upload-dropzone">
              <Upload className="upload-icon" />
              <p className="upload-text">Drag and drop or browse</p>
              <p className="upload-formats">Supported formats: JPG, PNG, JPEG</p>
              <label className="browse-btn">
                Browse
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <p className="image-source">Images provided by Google Maps.</p>

          {/* Home Design Style */}
          <div className="home-design-style">
            <h3>Home Design Style</h3>
            <div className="style-details">
              <div className="style-detail">
                <label>Architecture Character</label>
                <span>{styleData.architectureStyle}</span>
              </div>
              <div className="style-detail">
                <label>Roof Type</label>
                <span>{styleData.roofType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="style-nav">
        <button className="nav-btn nav-btn-back" onClick={onBack}>
          &lt;&lt; BACK
        </button>
        <div className="right-nav">
          <button className="nav-btn nav-btn-secondary" onClick={onRebuildNew}>
            I want to Rebuild Something New
          </button>
          <button className="nav-btn nav-btn-next" onClick={handleNext}>
            REBUILD SAME STYLE
          </button>
        </div>
      </div>

      {/* Chatbot Icon */}
      <div className="chatbot-icon">
        <MessageCircle />
      </div>
    </div>
  );
};

export default UserPreferencesStyle;
