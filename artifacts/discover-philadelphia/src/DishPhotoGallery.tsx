import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListDishPhotosQueryKey,
  useCreateDishPhoto,
  useListDishPhotos,
  type DishPhoto,
} from '@workspace/api-client-react';

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1280;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('This image could not be opened. Try another photo.'));
        return;
      }

      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Your browser could not prepare this image. Try another browser.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || !SUPPORTED_IMAGE_TYPES.has(blob.type)) {
            reject(new Error('This image could not be resized as JPEG, PNG, or WebP.'));
            return;
          }
          if (blob.size > MAX_FILE_BYTES) {
            reject(new Error('The resized photo is over 3 MB. Choose a smaller image.'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result !== 'string') {
              reject(new Error('This image could not be prepared for upload.'));
              return;
            }
            resolve(reader.result);
          };
          reader.onerror = () => reject(new Error('This image could not be prepared for upload.'));
          reader.readAsDataURL(blob);
        },
        file.type,
        file.type === 'image/png' ? undefined : 0.88,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image could not be opened. Try another photo.'));
    };
    image.src = objectUrl;
  });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function checkSelectedFile(file: File): string | null {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return 'Choose a JPEG, PNG, or WebP photo. GIFs and other file types are not supported.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Choose a photo that is 3 MB or smaller.';
  }
  return null;
}

function DishPhotoGallery() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const photosQuery = useListDishPhotos();
  const createPhoto = useCreateDishPhoto();

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setUploadError('');
    setSuccessMessage('');
    setSelectedFile(null);
    if (!file) return;

    const error = checkSelectedFile(file);
    if (error) {
      setUploadError(error);
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError('');
    setSuccessMessage('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setUploadError('Add a title for your dish photo.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Choose a JPEG, PNG, or WebP photo to upload.');
      return;
    }
    const fileError = checkSelectedFile(selectedFile);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    try {
      setIsPreparing(true);
      const imageData = await resizeImageToDataUrl(selectedFile);
      const savedPhoto = await createPhoto.mutateAsync({
        data: {
          title: cleanTitle,
          ...(caption.trim() ? { caption: caption.trim() } : {}),
          imageData,
        },
      });
      queryClient.setQueryData<DishPhoto[]>(getListDishPhotosQueryKey(), (current = []) => [
        savedPhoto,
        ...current.filter((photo) => photo.id !== savedPhoto.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: getListDishPhotosQueryKey() });
      setTitle('');
      setCaption('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMessage('Your dish photo has been added to the gallery.');
    } catch (error) {
      setUploadError(errorMessage(error, 'Your photo could not be saved. Please try again.'));
    } finally {
      setIsPreparing(false);
    }
  }

  const photos = photosQuery.data ?? [];
  const isSubmitting = isPreparing || createPhoto.isPending;

  return (
    <section className="dish-gallery" id="dish-gallery" aria-labelledby="dish-gallery-title">
      <div className="dish-gallery-heading">
        <div>
          <p className="section-kicker">A taste of Philly</p>
          <h2 className="section-title" id="dish-gallery-title">Show us your cheesesteak.</h2>
          <p className="dish-gallery-intro">
            Share the Philly bite you love. Add a photo to the community gallery.
          </p>
        </div>
        <span className="dish-gallery-count" aria-live="polite">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>

      <form className="dish-upload-form" onSubmit={handleSubmit}>
        <div className="dish-form-fields">
          <label className="dish-field">
            <span>Photo title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. My favorite corner cheesesteak"
              maxLength={120}
              required
              disabled={isSubmitting}
              data-testid="input-dish-title"
            />
          </label>
          <label className="dish-field">
            <span>Caption <small>Optional</small></span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Tell us what makes this Philly bite special…"
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
              data-testid="input-dish-caption"
            />
          </label>
        </div>
        <div className="dish-upload-controls">
          <div className="dish-file-area">
            <label className="dish-file-label" htmlFor="dish-photo-file">
              <span className="dish-file-icon" aria-hidden="true">+</span>
              <span>{selectedFile ? 'Choose a different photo' : 'Choose a photo'}</span>
            </label>
            <input
              ref={fileInputRef}
              id="dish-photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              aria-describedby="dish-photo-help"
              disabled={isSubmitting}
              data-testid="input-dish-photo"
            />
            <span className="dish-file-name">{selectedFile?.name ?? 'JPEG, PNG, or WebP · up to 3 MB'}</span>
          </div>
          <button className="dish-submit-button" type="submit" disabled={isSubmitting}>
            {isPreparing ? 'Preparing photo…' : createPhoto.isPending ? 'Adding photo…' : 'Add to the gallery'}
          </button>
        </div>
        <p className="dish-upload-help" id="dish-photo-help">
          Photos are resized to fit within 1280 pixels before upload.
        </p>
        {previewUrl && (
          <div className="dish-upload-preview">
            <img src={previewUrl} alt="Preview of the selected dish photo" />
            <span>Photo preview</span>
          </div>
        )}
        {uploadError && <p className="dish-feedback is-error" role="alert">{uploadError}</p>}
        {successMessage && <p className="dish-feedback is-success" role="status">{successMessage}</p>}
      </form>

      <div className="dish-photo-grid" aria-live="polite">
        {photosQuery.isLoading && <p className="dish-gallery-state">Loading community photos…</p>}
        {photosQuery.isError && photos.length === 0 && (
          <div className="dish-gallery-state is-error" role="alert">
            <p>{errorMessage(photosQuery.error, 'The gallery could not be loaded.')}</p>
            <button type="button" onClick={() => void photosQuery.refetch()}>Try again</button>
          </div>
        )}
        {!photosQuery.isLoading && !photosQuery.isError && photos.length === 0 && (
          <p className="dish-gallery-state">No photos yet. Share the first Philly favorite.</p>
        )}
        {photos.map((photo) => (
          <article className="dish-photo-card" key={photo.id} data-testid={`dish-photo-${photo.id}`}>
            <img className="dish-photo-image" src={photo.imageUrl} alt={photo.title} loading="lazy" />
            <div className="dish-photo-details">
              <div className="dish-photo-title-row">
                <h3>{photo.title}</h3>
                <time dateTime={photo.createdAt}>
                  {DATE_FORMATTER.format(new Date(photo.createdAt))}
                </time>
              </div>
              <p className="dish-photo-caption">{photo.caption || 'No caption added.'}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DishPhotoGallery;
