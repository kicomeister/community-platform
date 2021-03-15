import arrayMutators from 'final-form-arrays'
import createDecorator from 'final-form-calculate'
import { observer } from 'mobx-react'
import * as React from 'react'
import { Field, Form } from 'react-final-form'
import { Prompt, RouteComponentProps } from 'react-router'
import { Box } from 'rebass'
import IconHeaderHowto from 'src/assets/images/header-section/howto-header-icon.svg'
import { Button } from 'src/components/Button'
import ElWithBeforeIcon from 'src/components/ElWithBeforeIcon'
import Flex from 'src/components/Flex'
import { InputField, TextAreaField } from 'src/components/Form/Fields'
import { TagsSelectField } from 'src/components/Form/TagsSelect.field'
import Heading from 'src/components/Heading'
import { IResearch } from 'src/models/research.models'
import { useResearchStore } from 'src/stores/Research/research.store'
import theme from 'src/themes/styled.theme'
import { stripSpecialCharacters } from 'src/utils/helpers'
import { required } from 'src/utils/validators'
import styled from 'styled-components'
import { COMPARISONS } from './Comparisons'
import { PostingGuidelines } from './PostingGuidelines'
import ResearchSubmitStatus from './SubmitStatus'

const CONFIRM_DIALOG_MSG =
  'You have unsaved changes. Are you sure you want to leave this page?'

interface IState {
  formSaved: boolean
  _toDocsList: boolean
  showSubmitModal?: boolean
  draft: boolean
}
interface IProps extends RouteComponentProps<any> {
  formValues: any
  parentType: 'create' | 'edit'
}

const FormContainer = styled.form`
  width: 100%;
`

const Label = styled.label`
  font-size: ${theme.fontSizes[2] + 'px'};
  margin-bottom: ${theme.space[2] + 'px'};
  display: block;
`

const beforeUnload = function(e) {
  e.preventDefault()
  e.returnValue = CONFIRM_DIALOG_MSG
}

const ResearchForm = observer((props: IProps) => {
  const store = useResearchStore()
  const [state, setState] = React.useState<IState>({
    formSaved: false,
    _toDocsList: false,
    showSubmitModal: false,
    draft: props.formValues.moderation === 'draft',
  })

  const trySubmitForm = (draft: boolean) => {
    console.log('starting submit')
    setState(prevState => {
      // Save requested draft value into state and then trigger form submit
      const form = document.getElementById('researchForm')
      let showSubmitModal = false
      if (typeof form !== 'undefined' && form !== null) {
        console.log('dispatching event')
        form.dispatchEvent(new Event('submit', { cancelable: true }))
        showSubmitModal = true
      }
      return {
        ...prevState,
        draft,
        showSubmitModal,
      }
    })
  }

  const onSubmit = async (formValues: IResearch.FormInput) => {
    console.log('submitting')
    formValues.moderation = state.draft ? 'draft' : 'awaiting-moderation'
    await store.uploadResearch(formValues)
    console.log('submitted')
  }

  const validateTitle = async (value: any) => {
    const originalId =
      props.parentType === 'edit' ? props.formValues._id : undefined
    return store.validateTitleForSlug(value, 'research', originalId)
  }

  // automatically generate the slug when the title changes
  const calculatedFields = createDecorator({
    field: 'title',
    updates: {
      slug: title => stripSpecialCharacters(title).toLowerCase(),
    },
  })

  // Display a confirmation dialog when leaving the page outside the React Router
  const unloadDecorator = form => {
    return form.subscribe(
      ({ dirty }) => {
        if (dirty && !store.uploadStatus.Complete) {
          window.addEventListener('beforeunload', beforeUnload, false)
          return
        }
        window.removeEventListener('beforeunload', beforeUnload, false)
      },
      { dirty: true },
    )
  }

  return (
    <>
      {state.showSubmitModal && (
        <ResearchSubmitStatus
          {...props}
          onClose={() => {
            setState(prevState => ({ ...prevState, showSubmitModal: false }))
            store.resetUploadStatus()
          }}
        />
      )}
      <Form
        onSubmit={v => {
          onSubmit(v as IResearch.FormInput)
        }}
        initialValues={props.formValues}
        mutators={{
          ...arrayMutators,
        }}
        validateOnBlur
        decorators={[calculatedFields, unloadDecorator]}
        render={({ submitting, dirty, handleSubmit }) => {
          return (
            <Flex mx={-2} bg={'inherit'} flexWrap="wrap">
              <Flex bg="inherit" px={2} width={[1, 1, 2 / 3]} mt={4}>
                <Prompt
                  when={!store.uploadStatus.Complete && dirty}
                  message={CONFIRM_DIALOG_MSG}
                />
                <FormContainer id="researchForm" onSubmit={handleSubmit}>
                  {/* Research Info */}
                  <Flex flexDirection={'column'}>
                    <Flex
                      card
                      mediumRadius
                      bg={theme.colors.softblue}
                      px={3}
                      py={2}
                      alignItems="center"
                    >
                      <Heading medium>
                        {props.parentType === 'create' ? (
                          <span>Start</span>
                        ) : (
                          <span>Edit</span>
                        )}{' '}
                        your Research
                      </Heading>
                      <Box ml="15px">
                        <ElWithBeforeIcon
                          IconUrl={IconHeaderHowto}
                          height="20px"
                        />
                      </Box>
                    </Flex>
                    <Box
                      sx={{ mt: '20px', display: ['block', 'block', 'none'] }}
                    >
                      <PostingGuidelines />
                    </Box>
                    <Flex
                      card
                      mediumRadius
                      bg={'white'}
                      mt={3}
                      p={4}
                      flexWrap="wrap"
                      flexDirection="column"
                    >
                      <Heading small mb={3}>
                        Introduction
                      </Heading>
                      <Flex mx={-2} flexDirection={['column', 'column', 'row']}>
                        <Flex flex={[1, 1, 4]} px={2} flexDirection="column">
                          <Flex flexDirection={'column'} mb={3}>
                            <Label htmlFor="title">
                              Title of your research. Can we...
                            </Label>
                            <Field
                              id="title"
                              name="title"
                              data-cy="intro-title"
                              validateFields={[]}
                              validate={validateTitle}
                              isEqual={COMPARISONS.textInput}
                              component={InputField}
                              maxLength="50"
                              placeholder="Make a chair from.. (max 50 characters)"
                            />
                          </Flex>
                          <Flex flexDirection={'column'} mb={3}>
                            <Label htmlFor="description">
                              What are you trying to find out?
                            </Label>
                            <Field
                              id="description"
                              name="description"
                              data-cy="intro-description"
                              validate={required}
                              validateFields={[]}
                              isEqual={COMPARISONS.textInput}
                              component={TextAreaField}
                              style={{
                                resize: 'none',
                                flex: 1,
                                minHeight: '150px',
                              }}
                              maxLength="400"
                              placeholder="Introduction to your research question. Mention what you want to do, inspiration you got, what challenges you must see etc (max 400 characters)"
                            />
                          </Flex>
                          <Flex flexDirection={'column'} mb={3}>
                            <Label>Select tags for your Research</Label>
                            <Field
                              name="tags"
                              component={TagsSelectField}
                              category="research"
                              isEqual={COMPARISONS.tags}
                            />
                          </Flex>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>
                </FormContainer>
              </Flex>
              {/* post guidelines container */}
              <Flex
                flexDirection={'column'}
                width={[1, 1, 1 / 3]}
                height={'100%'}
                bg="inherit"
                px={2}
                mt={[0, 0, 4]}
              >
                <Box
                  sx={{
                    position: ['relative', 'relative', 'fixed'],
                    maxWidth: ['inherit', 'inherit', '400px'],
                  }}
                >
                  <Box sx={{ display: ['none', 'none', 'block'] }}>
                    <PostingGuidelines />
                  </Box>
                  <Button
                    data-cy={'draft'}
                    onClick={() => trySubmitForm(true)}
                    width={1}
                    mt={[0, 0, 3]}
                    variant="secondary"
                    type="submit"
                    disabled={submitting}
                    sx={{ display: 'block' }}
                  >
                    {props.formValues.moderation !== 'draft' ? (
                      <span>Save to draft</span>
                    ) : (
                      <span>Revert to draft</span>
                    )}{' '}
                  </Button>
                  <Button
                    data-cy={'submit'}
                    onClick={() => trySubmitForm(false)}
                    width={1}
                    mt={3}
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                    sx={{ mb: ['40px', '40px', 0] }}
                  >
                    <span>Publish</span>
                  </Button>
                </Box>
              </Flex>
            </Flex>
          )
        }}
      />
    </>
  )
})

export default ResearchForm
