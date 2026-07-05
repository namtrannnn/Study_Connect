export const buildPostFormData = ({
    postType,
    category,
    caption,
    location,
    visibility,
    allowComments,
    hideLikeCount,
    hideShare,
    images,
    project,
    question,
    learning,
    collaboration,
}) => {
    const formData = new FormData();

    formData.append('postType', postType || 'normal');
    formData.append('category', category || 'other');
    formData.append('caption', caption || '');
    formData.append('location', location || '');
    formData.append('visibility', visibility || 'public');

    formData.append('allowComments', String(allowComments ?? true));
    formData.append('hideLikeCount', String(hideLikeCount ?? false));
    formData.append('hideShare', String(hideShare ?? false));

    if (postType === 'project') {
        formData.append('project', JSON.stringify(project || {}));
    }

    if (postType === 'question') {
        formData.append('question', JSON.stringify(question || {}));
    }

    if (postType === 'learning') {
        formData.append('learning', JSON.stringify(learning || {}));
    }

    if (postType === 'collaboration') {
        formData.append('collaboration', JSON.stringify(collaboration || {}));
    }

    if (Array.isArray(images)) {
        images.forEach((image) => {
            formData.append('images', image);
        });
    }

    return formData;
};
