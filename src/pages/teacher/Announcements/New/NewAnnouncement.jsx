import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import Input from '../../../../components/shared/Input'
import { Textarea } from '../../../../components/shared/Input'
import { useToast } from '../../../../context/ToastContext'
import { announcementAPI, classAPI } from '../../../../services/api'
import { validateField } from '../../../../utils/validation'
import styles from './NewAnnouncement.module.css'

const NewAnnouncement = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [className, setClassName] = useState('')
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isValid, setIsValid] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await classAPI.getClassById(classId)
        setClassName(res.data.data.class?.name || 'Your Class')
      } catch {
        setClassName('Your Class')
      }
    }
    fetchClass()
  }, [classId])

  useEffect(() => {
    const newErrors = {}
    let valid = true
    const titleErr = validateField('announcementTitle', formData.title)
    const contentErr = validateField('announcementContent', formData.content)
    if (titleErr) { newErrors.title = titleErr; valid = false }
    if (contentErr) { newErrors.content = contentErr; valid = false }
    setErrors(newErrors)
    setIsValid(valid)
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ title: true, content: true })
    if (!isValid) return
    setLoading(true)
    try {
      await announcementAPI.createAnnouncement(classId, formData)
      toast.success('Announcement posted successfully!')
      navigate('/teacher/classes')
    } catch (err) {
      console.error('Create announcement error:', err)
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create announcement'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.newAnnouncementPage}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/teacher/classes')}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Back to Classes
          </button>
          <h1 className={styles.pageTitle}>New Announcement</h1>
          <p className={styles.pageSubtitle}>Posting to: {className}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.announcementForm}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>Create Announcement</h3>
              <p className={styles.formSubtitle}>Share important updates with your students</p>
            </div>
            <div className={styles.formFields}>
              <Input
                label="Announcement Title"
                name="title"
                placeholder="e.g. Quiz on Friday, Assignment Reminder..."
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.title ? errors.title : ''}
                required
                disabled={loading}
              />
              <Textarea
                label="Announcement Content"
                name="content"
                placeholder="Write your announcement details here..."
                value={formData.content}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.content ? errors.content : ''}
                required
                rows={8}
                disabled={loading}
              />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={() => navigate('/teacher/classes')} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" disabled={loading || !isValid}>
                {loading ? 'Posting...' : 'Post Announcement'}
              </Button>
            </div>
          </div>
        </form>

        {(formData.title || formData.content) && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewTitle}>Preview</h3>
            <div className={styles.announcementPreview}>
              <div className={styles.previewHeader}>
                <div className={styles.previewAuthor}>
                  <div className={styles.authorAvatar}>T</div>
                  <div className={styles.authorInfo}>
                    <p className={styles.authorName}>You (Teacher)</p>
                    <p className={styles.postTime}>Just now</p>
                  </div>
                </div>
              </div>
              <div className={styles.previewContent}>
                {formData.title && <h4 className={styles.previewAnnouncementTitle}>{formData.title}</h4>}
                {formData.content && <div className={styles.previewText}>{formData.content.split('\n').map((line, i) => (<p key={i}>{line || <br />}</p>))}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default NewAnnouncement
