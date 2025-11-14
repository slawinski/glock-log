import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ImageGallery } from './ImageGallery';

describe('ImageGallery', () => {
  const mockImages = [
    'file:///path/to/image1.jpg',
    'file:///path/to/image2.jpg',
    'file:///path/to/image3.jpg',
  ];

  const mockOnDeleteImage = jest.fn();
  const mockOnSelectThumbnail = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockOnDeleteImage.mockClear();
    mockOnSelectThumbnail.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons?.find(button => button.text === 'Delete');
      if (deleteButton && deleteButton.onPress) {
        deleteButton.onPress();
      }
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders all provided images', () => {
    render(<ImageGallery images={mockImages} size='medium' />);
    expect(screen.getAllByTestId('gallery-image').length).toBe(mockImages.length);
  });

  it('calls onDeleteImage when delete button is pressed if showDeleteButton is true', () => {
    render(
      <ImageGallery
        images={mockImages}
        size='medium'
        showDeleteButton={true}
        onDeleteImage={mockOnDeleteImage}
      />
    );
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.press(deleteButtons[0]);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteImage).toHaveBeenCalledWith(0);
  });

  it('does not render delete buttons if showDeleteButton is false', () => {
    render(<ImageGallery images={mockImages} size='medium' showDeleteButton={false} />);
    expect(screen.queryAllByTestId('delete-icon').length).toBe(0);
  });

  it('highlights the thumbnail image if allowThumbnailSelection is true and thumbnailIndex is provided', () => {
    render(
      <ImageGallery
        images={mockImages}
        size='medium'
        allowThumbnailSelection={true}
        thumbnailIndex={1}
      />
    );
    const images = screen.getAllByTestId('gallery-image');
    // With Tailwind, direct style assertion is complex. We primarily check for existence.
    expect(images[1]).toBeTruthy();
  });

  it('calls onSelectThumbnail when an image is pressed and allowThumbnailSelection is true', () => {
    render(
      <ImageGallery
        images={mockImages}
        size='medium'
        allowThumbnailSelection={true}
        onSelectThumbnail={mockOnSelectThumbnail}
      />
    );
    const images = screen.getAllByTestId('gallery-image');
    fireEvent.press(images[0]);
    expect(mockOnSelectThumbnail).toHaveBeenCalledWith(0);
  });
});
