import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import Input from '../../../../components/shared/Input'
import { Textarea } from '../../../../components/shared/Input'
import { announcementAPI } from '../../../../services/api'
import styles from './NewAnnouncement.module.css'

const NewAnnouncement = () => {
  const { classId } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await announcementAPI.createAnnouncement(classId, formData)
      alert('Announcement posted successfully!')
      navigate('/teacher/classes')
    } catch (err) {
      console.error('Create announcement error:', err)
      alert(err.response?.data?.message || 'Failed to create announcement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.newAnnouncementPage}>

        <div className={styles.pageHeader}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/teacher/classes')}
          >
            ← Back to Classes
          </button>
          <h1 className={styles.pageTitle}>New Announcement</h1>
          <p className={styles.pageSubtitle}>
            Posting to Class ID: {classId}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.announcementForm}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>📢 Create Announcement</h3>
              <p className={styles.formSubtitle}>
                Share important updates with your students
              </p>
            </div>

            <div className={styles.formFields}>
              <Input
                label="Announcement Title"
                name="title"
                placeholder="e.g. Quiz on Friday, Assignment Reminder..."
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <Textarea
                label="Announcement Content"
                name="content"
                placeholder="Write your announcement details here..."
                value={formData.content}
                onChange={handleChange}
                error={errors.content}
                required
                rows={8}
              />
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/teacher/classes')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Posting...' : '📢 Post Announcement'}
              </Button>
            </div>
          </div>
        </form>

        {(formData.title || formData.content) && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewTitle}>👀 Preview</h3>
            <div className={styles.announcementPreview}>
              <div className={styles.previewHeader}>
                <div className={styles.previewAuthor}>
                  <div className={styles.authorAvatar}>👨‍🏫</div>
                  <div className={styles.authorInfo}>
                    <p className={styles.authorName}>You (Teacher)</p>
                    <p className={styles.postTime}>Just now</p>
                  </div>
                </div>
              </div>
              <div className={styles.previewContent}>
                {formData.title && (
                  <h4 className={styles.previewAnnouncementTitle}>
                    {formData.title}
                  </h4>
                )}
                {formData.content && (
                  <div className={styles.previewText}>
                    {formData.content.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

export default NewAnnouncement
