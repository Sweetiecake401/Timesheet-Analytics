//---------------------- React
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

//--------------------- API
import api from '_api';

//---------------------- MUI
import { useTheme } from '@mui/material/styles';
import { Button, DialogContent, DialogTitle, Divider, Grid, TextField, InputLabel, Autocomplete } from '@mui/material';

//----------------------- Other
import _ from 'lodash';
import * as Yup from 'yup';
import moment from 'moment';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { openSnackbar } from 'store/reducers/snackbar';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Swal from 'sweetalert2'; // Import SweetAlert

const getInitialValues = (customer) => {
  const newCustomer = {
    project_id: '',
    client_id: '',
    group_id: '',
    project_code: '',
    project_name: '',
    start_date: '',
    finish_date: '',
    due_date: ''
  };

  if (customer) {
    return _.merge({}, newCustomer, customer);
  }

  return newCustomer;
};

const AddProject = (props) => {
  const { customer, onCancel, fetchWorkTable } = props;
  const theme = useTheme();
  const dispatch = useDispatch();
  const isCreating = !!customer;
  const [boardId, setBoardId] = useState([]);
  // const [boardData, setBoardData] = useState([]);
  // const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [options, setOptions] = useState([]);
  const [group, setGroup] = useState();
  const [oldProjectName, setOldProjectName] = useState([]);

  // useEffect(() => {
  //   const getBoardId = async () => {
  //     try {
  //       const { data, isStatus } = await api.monday.getBoardId();
  //       if (isStatus) {
  //         const projectNames = data.data.boards
  //           .filter((board) => board.name.includes('Subitems of'))
  //           .map((board) => board.name.replace('Subitems of', '').trim()); // Extract project names
  //         console.log('projectNames', projectNames);
  //         const boards = data.data.boards.filter((board) => board.name.includes('Subitems of'));

  //         const boardInfo = boards.map((board) => ({
  //           board_id: board.id, // Get board_id
  //           name: board.name.replace('Subitems of', '').trim() // Extract project name
  //         }));
  //         setBoardId(projectNames);
  //         setBoardData(boardInfo);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   getBoardId();
  // }, []);

  // useEffect(() => {
  //   const getBoardData = async () => {
  //     try {
  //       const { data, isStatus } = await api.monday.getBoardId();
  //       // console.log('data monday', data);
  //       if (isStatus) {
  //         const boards = data.data.boards.filter((board) => board.name.includes('Subitems of'));

  //         const boardInfo = boards.map((board) => ({
  //           board_id: board.id, // Get board_id
  //           name: board.name.replace('Subitems of', '').trim() // Extract project name
  //         }));

  //         setBoardId(boardInfo);
  //         // console.log('boardData', boardInfo);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   getBoardData();
  // }, []);

  //Call API Group
  const getGroup = async () => {
    try {
      const { data, isStatus } = await api.group.getGroup();
      // console.log('getGroup', data);
      if (isStatus) {
        const optionData = data.map((item) => ({
          group_id: item.group_id, // Set the value for each option
          group_name: item.group_name // Set the label for each option
        }));
        setGroup(optionData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubDataClient = async () => {
    try {
      const { data, isStatus } = await api.work.fetchDataClient();
      // console.log('ดูแค่อันนี้นะ', data);
      if (isStatus) {
        const optionData = data.map((item) => ({
          client_id: item.client_id, // Set the value for each option
          client_name: item.client_name // Set the label for each option
        }));
        setOptions(optionData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOldProject = async () => {
    try {
      const { data, isStatus } = await api.work.fetchTaskProject();
      if (isStatus) {
        const optionData = data.map((item) => ({
          project_code: item.project_code,
          project_name: item.project_name
        }));
        setOldProjectName(optionData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkCode = oldProjectName.map((item) => item.project_code);
  const checkName = oldProjectName.map((item) => item.project_name);

  // const validateProjectCode = () => {
  //   console.log('value is', formik.values.project_code);
  //   return !checkName.includes(formik.values.project_code) || formik.values.project_code === null
  //     ? 'Project Code is required'
  //     : 'It is duplicate data';
  // };

  console.log('Project Codes from oldProjectName:', checkCode);

  useEffect(() => {
    fetchSubDataClient();
    getGroup();
    fetchOldProject();
  }, []);

  // console.log('oldProjectName', oldProjectName);

  const CustomerSchema = Yup.object().shape({
    project_code: Yup.string()
      .max(255)
      .test('check-duplicate', 'The specified code already exists in the database.', function (value) {
        const { project_code: originalValue } = this.parent;
        return !checkCode.includes(value) || !originalValue; // Check for duplicate only if originalValue is not empty
      })
      .required('Project Code is required'),
    project_name: Yup.string()
      .max(255)
      .test('check-duplicate', 'The specified name already exists in the database.', function (value) {
        const { project_code: originalValue } = this.parent;
        return !checkName.includes(value) || !originalValue; // Check for duplicate only if originalValue is not empty
      })
      .required('Project Name is required'),
    group_id: Yup.string().max(36).required('Group Name is required'),
    client_id: Yup.string().max(36).required('Client Name is required'),
    start_date: Yup.string().max(255).required('Start Date is required'),
    finish_date: Yup.string()
      .max(255)
      .required('Finish Date is required')
      .test('date-order', 'Finish Date must be equal or after Start Date', function (finishDate) {
        const { start_date: startDate } = this.parent;
        return moment(finishDate, 'DD-MM-YYYY').isSameOrAfter(moment(startDate, 'DD-MM-YYYY'));
      }),
    due_date: Yup.string()
      .max(255)
      .required('Go Live Date is required')
      .test('date-order', 'Go Live Date must be after Finish Date', function (dueDate) {
        const { finish_date: finishDate } = this.parent;
        return moment(dueDate, 'DD-MM-YYYY').isAfter(moment(finishDate, 'DD-MM-YYYY'));
      })
  });

  const submitConfirm = async (values) => {
    try {
      if (isCreating) {
        await updateModule(formik.values);
        Swal.fire({
          title: 'Success',
          customClass: 'modal-success',
          timer: 2000,
          showConfirmButton: false,
          iconHtml:
            '<svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 512 512" fill="#76ca66"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.970-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"/></svg>'
        });
      } else {
        await setModule();
        Swal.fire({
          title: 'Success',
          customClass: 'modal-success',
          timer: 2000,
          showConfirmButton: false,
          iconHtml:
            '<svg xmlns="http://www.w3.org/2000/svg" height="1.25em" viewBox="0 0 512 512" fill="#76ca66"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.970-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"/></svg>'
        });
      }
      onCancel();
      fetchWorkTable();
    } catch (error) {
      console.error(error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error updating project.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    }
  };

  // console.log('data nakub', options);

  async function setModule() {
    const projectData = {
      project_code: formik.values.project_code,
      project_name: formik.values.project_name,
      boards_id: formik.values.boards_id,
      client_id: formik.values.client_id,
      group_id: formik.values.group_id,
      start_date: moment(formik.values.start_date, 'DD-MM-YYYY').format(),
      finish_date: moment(formik.values.finish_date, 'DD-MM-YYYY').format(),
      due_date: moment(formik.values.due_date, 'DD-MM-YYYY').format(),
      is_active: false,
      is_deleted: false
    };

    const createProject = await api.work.createProject([projectData]);
  }

  const handleCancel = () => {
    const formHasUnsavedChanges = Object.keys(touched).some((field) => touched[field]);
    // Prompt the user to confirm before closing if there are unsaved changes
    if (formHasUnsavedChanges) {
      Swal.fire({
        title: 'Cancel',
        text: 'If you cancel now, your information fills will be discard.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0066FF',
        cancelButtonColor: '#0066FF',
        reverseButtons: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Keep Editing',
        customClass: {
          confirmButton: 'confirm-rounded-button',
          cancelButton: 'outlined-button'
        },
        iconHtml:
          '<svg width="150" height="150" viewBox="0 0 47 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.4339 0.666016C36.3209 0.666016 46.7673 11.1123 46.7673 23.9993C46.7673 36.8863 36.3209 47.3327 23.4339 47.3327C10.5469 47.3327 0.100586 36.8863 0.100586 23.9993C0.100586 11.1123 10.5469 0.666016 23.4339 0.666016ZM23.4339 5.33268C18.4832 5.33268 13.7353 7.29934 10.2346 10.8C6.73391 14.3007 4.76725 19.0486 4.76725 23.9993C4.76725 28.9501 6.73391 33.698 10.2346 37.1987C13.7353 40.6994 18.4832 42.666 23.4339 42.666C28.3846 42.666 33.1326 40.6994 36.6332 37.1987C40.1339 33.698 42.1006 28.9501 42.1006 23.9993C42.1006 19.0486 40.1339 14.3007 36.6332 10.8C33.1326 7.29934 28.3846 5.33268 23.4339 5.33268ZM23.4339 30.9993C24.0528 30.9993 24.6462 31.2452 25.0838 31.6828C25.5214 32.1203 25.7673 32.7138 25.7673 33.3327C25.7673 33.9515 25.5214 34.545 25.0838 34.9826C24.6462 35.4202 24.0528 35.666 23.4339 35.666C22.8151 35.666 22.2216 35.4202 21.784 34.9826C21.3464 34.545 21.1006 33.9515 21.1006 33.3327C21.1006 32.7138 21.3464 32.1203 21.784 31.6828C22.2216 31.2452 22.8151 30.9993 23.4339 30.9993ZM23.4339 9.99935C24.0528 9.99935 24.6462 10.2452 25.0838 10.6828C25.5214 11.1204 25.7673 11.7138 25.7673 12.3327V26.3327C25.7673 26.9515 25.5214 27.545 25.0838 27.9826C24.6462 28.4202 24.0528 28.666 23.4339 28.666C22.8151 28.666 22.2216 28.4202 21.784 27.9826C21.3464 27.545 21.1006 26.9515 21.1006 26.3327V12.3327C21.1006 11.7138 21.3464 11.1204 21.784 10.6828C22.2216 10.2452 22.8151 9.99935 23.4339 9.99935Z" fill="#ED4040"/></svg>'
      }).then(async (result) => {
        if (result.isConfirmed) {
          formik.resetForm();
          onCancel();
        }
      });
    } else {
      formik.resetForm();
      onCancel();
    }
  };

  async function updateModule(values) {
    const updateProjectData = {
      ...values,
      start_date: moment(formik.values.start_date, 'DD-MM-YYYY').format(),
      finish_date: moment(formik.values.finish_date, 'DD-MM-YYYY').format(),
      due_date: moment(formik.values.due_date, 'DD-MM-YYYY').format(),
      project_id: values.project_id
    };

    const updateData = await api.work.updateProject([updateProjectData]);
    console.log('updateProjectData', updateProjectData);
    // window.location.reload(true);
  }

  const formik = useFormik({
    initialValues: getInitialValues(customer),
    validationSchema: CustomerSchema,
    onSubmit: submitConfirm
  });

  const { errors, touched, getFieldProps, handleSubmit } = formik;
  // console.log('formik.values', formik.values);

  // const isFormValid = Object.keys(errors).length === 0 && Object.keys(touched).length !== 0;

  return (
    <React.Fragment>
      <DialogTitle sx={{ px: 3, backgroundColor: '#f3f4f6 ', fontSize: '24px', fontWeight: 'bold' }} id="scroll-dialog-title">
        {isCreating ? 'Edit Project' : 'Add Project'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="Client" style={{ marginBottom: '200px' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Project Code
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                {/* <TextField
                  fullWidth
                  rows={4}
                  placeholder="Project Code"
                  value={formik.values.project_code}
                  {...getFieldProps('project_code')}
                  error={Boolean(touched.project_code && errors.project_code)}
                  helperText={touched.project_code && errors.project_code}
                  InputProps={{ sx: { borderRadius: '30px' } }}
                /> */}
                <TextField
                  fullWidth
                  rows={4}
                  placeholder="Project Code"
                  value={formik.values.project_code}
                  {...getFieldProps('project_code')}
                  error={Boolean(touched.project_code && errors.project_code)}
                  helperText={
                    touched.project_code
                      ? errors.project_code || (checkCode.includes(formik.values.project_code) ? 'It is duplicate data' : '')
                      : ''
                  }
                  InputProps={{ sx: { borderRadius: '30px' } }}
                />
              </Grid>

              {/* <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Project Name
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                <Autocomplete
                  fullWidth
                  freeSolo
                  value={formik.values.project_name}
                  inputValue={formik.values.project_name}
                  onInputChange={(event, newInputValue) => {
                    console.log('project_name', newInputValue);
                    formik.setFieldValue('project_name', newInputValue);
                    const selectedBoard = boardData.find((board) => board.name === newInputValue);
                    if (selectedBoard) {
                      formik.setFieldValue('boards_id', selectedBoard.board_id);
                      console.log('1', newInputValue);
                      console.log('2', selectedBoard.board_id);
                    }

                    // formik.setFieldValue('boards_id', newInputValue);
                  }}
                  options={boardId} // Use the project names from boardId as options
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Project Name"
                      {...getFieldProps('project_name')}
                      error={Boolean(touched.project_name && errors.project_name)}
                      helperText={touched.project_name && errors.project_name}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          ...params.InputProps.sx,
                          borderRadius: '30px'
                        }
                      }}
                    />
                  )}
                />
              </Grid> */}

              <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Project Name
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                <TextField
                  fullWidth
                  rows={4}
                  placeholder="Project Name"
                  value={formik.values.project_name}
                  {...getFieldProps('project_name')}
                  error={Boolean(touched.project_name && errors.project_name)}
                  helperText={
                    touched.project_name
                      ? errors.project_name || (checkCode.includes(formik.values.project_name) ? 'It is duplicate data' : '')
                      : ''
                  }
                  InputProps={{ sx: { borderRadius: '30px' } }}
                />
              </Grid>

              {/* Select Input */}

              {/* <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Project Name
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                <Autocomplete
                  id="project_name"
                  fullWidth
                  freeSolo
                  value={formik.values.project_name}
                  inputValue={formik.values.project_name}
                  onInputChange={(event, newInputValue) => {
                    console.log('project_name', newInputValue);
                    // Find the selected board by name in the boardId array
                    formik.setFieldValue('project_name', newInputValue);
                    const selectedBoard = boardId.find((board) => board.name === newInputValue);
                    if (selectedBoard) {
                      formik.setFieldValue('boards_id', selectedBoard.board_id);
                      console.log('boards_id', selectedBoard.board_id);
                    }
                  }}
                  options={boardId.map((option) => option.name)} // Map to an array of project names
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Project Name"
                      {...getFieldProps('project_name')}
                      error={Boolean(touched.project_name && errors.project_name)}
                      helperText={touched.project_name && errors.project_name}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          ...params.InputProps.sx,
                          borderRadius: '30px'
                        }
                      }}
                    />
                  )}
                />
              </Grid> */}

              <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Client Name
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                <Autocomplete
                  id="client_name"
                  fullWidth
                  value={options.find((option) => option.client_id === formik.values.client_id) || null}
                  onChange={(event, newValue) => {
                    if (newValue !== null) {
                      formik.setFieldValue('client_id', newValue.client_id);
                      console.log('Selected Client ID:', newValue);
                    } else {
                      formik.setFieldValue('client_id', '');
                    }
                  }}
                  options={options}
                  getOptionLabel={(option) => option.client_name || ''}
                  isOptionEqualToValue={(option, value) => option.client_id === value.client_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Client Name"
                      // {...getFieldProps('client_id')}
                      error={Boolean(touched.client_id && errors.client_id)}
                      helperText={touched.client_id && errors.client_id}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          ...params.InputProps.sx,
                          borderRadius: '30px'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Group Name
                  <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                </InputLabel>
                <Autocomplete
                  id="group_name"
                  fullWidth
                  value={(group && group.find((option) => option.group_id === formik.values.group_id)) || null}
                  onChange={(event, newValue) => {
                    if (newValue !== null) {
                      console.log('newValue', newValue);
                      formik.setFieldValue('group_id', newValue.group_id);
                    } else {
                      formik.setFieldValue('group_id', '');
                    }
                  }}
                  options={group || []}
                  getOptionLabel={(option) => option.group_name || ''}
                  isOptionEqualToValue={(option, value) => option.group_id === value.group_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Group Name"
                      // {...getFieldProps('group_id')}
                      error={Boolean(touched.group_id && errors.group_id)}
                      helperText={touched.group_id && errors.group_id}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          ...params.InputProps.sx,
                          borderRadius: '30px'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <InputLabel sx={{ marginBottom: '5px' }}>
                    Start Date
                    <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                  </InputLabel>
                  <DesktopDatePicker
                    value={formik.values.start_date ? moment(formik.values.start_date, 'DD-MM-YYYY').toDate() : null}
                    onChange={(date) => formik.setFieldValue('start_date', date ? moment(date).format('DD-MM-YYYY') : '')}
                    inputFormat="dd/MM/yyyy"
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        placeholder="Start Date"
                        {...getFieldProps('start_date')}
                        error={Boolean(touched.start_date && errors.start_date)}
                        helperText={touched.start_date && errors.start_date}
                        onChange={(e) => {
                          const enteredDate = e.target.value;
                          // Check if the entered date matches the desired format 'DD-MM-YYYY'
                          if (/^\d{2}-\d{2}-\d{4}$/.test(enteredDate)) {
                            formik.setFieldValue('start_date', enteredDate);
                          } else {
                            // Handle invalid date format here if needed
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            ...params.InputProps.sx,
                            borderRadius: '30px'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <InputLabel sx={{ marginBottom: '5px' }}>
                    Finish Date
                    <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                  </InputLabel>
                  <DesktopDatePicker
                    value={formik.values.finish_date ? moment(formik.values.finish_date, 'DD-MM-YYYY').toDate() : null}
                    onChange={(date) => formik.setFieldValue('finish_date', date ? moment(date).format('DD-MM-YYYY') : '')}
                    inputFormat="dd/MM/yyyy"
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        placeholder="Finish Date"
                        {...getFieldProps('finish_date')}
                        error={Boolean(touched.finish_date && errors.finish_date)}
                        helperText={touched.finish_date && errors.finish_date}
                        onChange={(e) => {
                          const enteredDate = e.target.value;
                          // Check if the entered date matches the desired format 'DD-MM-YYYY'
                          if (/^\d{2}-\d{2}-\d{4}$/.test(enteredDate)) {
                            formik.setFieldValue('finish_date', enteredDate);
                          } else {
                            // Handle invalid date format here if needed
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            ...params.InputProps.sx,
                            borderRadius: '30px'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <InputLabel sx={{ marginBottom: '5px' }}>
                    Go Live
                    <span style={{ color: 'red', marginLeft: '3px' }}>*</span>
                  </InputLabel>
                  <DesktopDatePicker
                    value={formik.values.due_date ? moment(formik.values.due_date, 'DD-MM-YYYY').toDate() : null}
                    onChange={(date) => formik.setFieldValue('due_date', date ? moment(date).format('DD-MM-YYYY') : '')}
                    inputFormat="dd/MM/yyyy"
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        placeholder="Go Live"
                        {...getFieldProps('due_date')}
                        error={Boolean(touched.due_date && errors.due_date)}
                        helperText={touched.due_date && errors.due_date}
                        onChange={(e) => {
                          const enteredDate = e.target.value;
                          // Check if the entered date matches the desired format 'DD-MM-YYYY'
                          if (/^\d{2}-\d{2}-\d{4}$/.test(enteredDate)) {
                            formik.setFieldValue('due_date', enteredDate);
                          } else {
                            // Handle invalid date format here if needed
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            ...params.InputProps.sx,
                            borderRadius: '30px'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', padding: '0 2.5 0 2.5' }}>
            <div style={{ display: 'flex', padding: '5px 7px 5px 7px', alignItems: 'center' }}>
              <Button
                onClick={handleCancel}
                variant="outlined"
                sx={{
                  width: '150px',
                  marginLeft: '5px',
                  height: 'auto',
                  borderRadius: '40px',
                  borderColor: '#232323',
                  color: '#232323',
                  '&:hover': {
                    borderColor: '#686868 !important',
                    color: '#686868'
                  }
                }}
              >
                Cancel
              </Button>
            </div>
            <div style={{ display: 'flex', padding: '5px 7px 5px 7px', alignItems: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  width: '150px',
                  marginLeft: '5px',
                  height: 'auto',
                  borderRadius: '40px',
                  backgroundColor: '#232323',
                  '&::after': {
                    boxShadow: '0 0 5px 5px rgba(0, 0, 0, 0.9)',
                    borderRadius: '40px'
                  },
                  '&:hover': {
                    backgroundColor: '#686868 !important'
                  }
                }}
                // disabled={!isFormValid && !isCreating}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
        <Divider />
      </form>
    </React.Fragment>
  );
};

AddProject.propTypes = {
  customer: PropTypes.object,
  onCancel: PropTypes.func.isRequired
};

export default AddProject;
