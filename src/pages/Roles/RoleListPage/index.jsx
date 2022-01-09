import {
  DeleteTwoTone,
  EditTwoTone,
  EyeTwoTone,
  LockTwoTone,
  UnlockTwoTone,
} from '@ant-design/icons';
import { TablePagination } from '@trendmicro/react-paginations';
import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import roleApis from '../../../api/roles';
import SearchBar from '../../../components/shared/SearchBar';
import parseErrorMessage from '../../../helpers/parseErrorMessage';
import capitalizeWord from '../../../helpers/string/capitalizeWord';
import { usePagination } from '../../../hooks';
import Breadcrumb from './Breadcrumb';

const RoleListPage = () => {
  // Constants
  const MODEL_NAMES = {
    singular: 'role',
    plural: 'roles',
  };
  const ACTIONS = {
    DELETE: 'delete',
    DEACTIVATE: 'deactivate',
    ACTIVATE: 'activate',
  };
  // Serverside states
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Redux
  const authRedux = useSelector((state) => state.auth);
  // Pagination states
  // const [page, setPage] = useState(1);
  // const [perPage, setPerPage] = useState(10);
  const {
    page,
    perPage,
    sortBy,
    order,
    searchString,
    handlePaginationChange,
    handleSortChange,
    handleSearchChange,
  } = usePagination();
  // History
  const history = useHistory();
  // Modal properties
  const [modalProperties, setModalProperties] = useState({
    confirmButtonText: '',
    confirmButtonColor: '',
    title: '',
    text: '',
    handleOk: async () => {
      return {
        status: '',
        id: '',
      };
    },
  });
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const columns = [
    {
      name: 'Title',
      selector: (row) => row.title?.toUpperCase(),
      sortable: true,
      center: true,
    },
    {
      name: 'Functionalities',
      selector: (row) => row.functionalityList?.length,
      sortable: true,
      center: true,
      grow: 2,
    },
    {
      name: 'Actions',
      sortable: false,
      center: true,
      cell: (row) => {
        const iconStyles = {
          fontSize: '20px',
          cursor: 'pointer',
        };

        return (
          <div>
            <Row>
              <Space>
                <Col>
                  <Tooltip title="Edit">
                    <EditTwoTone
                      style={iconStyles}
                      twoToneColor="#315659"
                      onClick={() => EditTableDatum(row._id)}
                    />
                  </Tooltip>
                </Col>
              </Space>
            </Row>
          </div>
        );
      },
    },
  ];

  // Table datum actions
  const ViewTableDatumDetail = (id) => {
    history.push(`/${MODEL_NAMES.plural}/view/${id}`);
  };

  const RemoveTableDatum = (id, name) => {
    renderModal(ACTIONS.DELETE, id, name);
  };

  const ActivateTableDatum = (id, name) => {
    renderModal(ACTIONS.ACTIVATE, id, name);
  };

  const DeactivateTableDatum = (id, name) => {
    renderModal(ACTIONS.DEACTIVATE, id, name);
  };

  const EditTableDatum = (id) => {
    history.push(`/${MODEL_NAMES.plural}/edit/${id}`);
  };

  // handle functions
  const handleAdd = () => {
    history.push(`/${MODEL_NAMES.plural}/add`);
  };

  const handlePageChange = (newPage) => {
    handlePaginationChange(newPage);
  };

  const handlePerRowsChange = (newPerPage, newPage) => {
    handlePaginationChange(newPage, newPerPage);
  };

  const handleRowsSelects = async (e) => {};

  const handleModalOk = async () => {
    setIsModalLoading(true);
    try {
      const { status, id } = await modalProperties.handleOk();

      message.success(
        `Successfully ${status} ${MODEL_NAMES.singular} with id: ${id}!`
      );
    } catch (error) {
      message.error(error.message);
    }
    setIsModalVisible(false);
    setIsModalLoading(false);
  };

  const handleDataSearch = (searchStr) => {
    handleSearchChange(searchStr);
  };

  const handleCreatedAtSortChange = (value) => {
    const jsonValue = JSON.parse(value);

    handleSortChange(jsonValue.sortBy, jsonValue.order);
  };

  // useEffect
  // Get total
  useEffect(() => {
    const getTotal = async () => {
      try {
        const axiosRes = await roleApis.getAll(authRedux.token, {
          search: searchString,
        });
        const response = axiosRes.data;
        setTotal(response.data.length);
      } catch (error) {
        setTableData([]);
        message.error(
          (error.response?.message || error.message || 'An unknown error') +
            ' has occurred!'
        );
      }
    };
    getTotal();
  }, [authRedux.token, searchString]);
  // Getting object (pagination)
  useEffect(() => {
    async function getData({ page, perPage }) {
      setLoading(true);
      try {
        const axiosRes = await roleApis.getAll(authRedux.token, {
          skip: (page - 1) * perPage,
          limit: perPage,
          search: searchString,
          sortBy,
          order,
        });
        const response = axiosRes.data;
        setTableData(response.data);
      } catch (error) {
        setTableData([]);
        message.error(
          (error.response?.message || error.message || 'An unknown error') +
            ' has occurred!'
        );
      }
      setLoading(false);
    }
    getData({ page, perPage });
  }, [authRedux.token, page, perPage, searchString, sortBy, order]);

  // Render functions
  const renderModal = (actionTitle, objectId, objective) => {
    const modalText = (
      <>
        Do you really want to {actionTitle.toLowerCase()}{' '}
        <strong>{`${MODEL_NAMES.singular}: ${objective}`}</strong>
      </>
    );
    switch (actionTitle.toLowerCase()) {
      case ACTIONS.DELETE: {
        setModalProperties({
          title: `Delete ${MODEL_NAMES.singular}`,
          confirmButtonText: 'Delete',
          confirmButtonColor: 'red',
          text: modalText,
          handleOk: async () => {
            try {
              await roleApis.deleteOne(authRedux.token, objectId);

              setTableData((tableData) => {
                const temp = tableData.map((datum) => {
                  if (datum.id === objectId) {
                    datum.isDeleted = true;
                  }
                  return datum;
                });

                return temp;
              });

              return {
                status: 'deleted',
                id: objectId,
              };
            } catch (error) {
              throw new Error(parseErrorMessage(error));
            }
          },
        });
        break;
      }
      case ACTIONS.DEACTIVATE: {
        setModalProperties({
          title: `Block ${MODEL_NAMES.singular}`,
          confirmButtonText: 'Block',
          confirmButtonColor: 'red',
          text: modalText,
          handleOk: async () => {
            try {
              await roleApis.putOne(authRedux.token, objectId, {
                isActive: false,
              });

              setTableData((tableData) => {
                const temp = tableData.map((datum) => {
                  if (datum.id === objectId) {
                    datum.isActive = false;
                  }
                  return datum;
                });

                return temp;
              });

              return {
                status: 'blocked',
                id: objectId,
              };
            } catch (error) {
              throw new Error(parseErrorMessage(error));
            }
          },
        });
        break;
      }
      case ACTIONS.ACTIVATE: {
        setModalProperties({
          title: `Unblock ${MODEL_NAMES.singular}`,
          confirmButtonText: 'Unblock',
          confirmButtonColor: 'green',
          text: modalText,
          handleOk: async () => {
            try {
              await roleApis.putOne(authRedux.token, objectId, {
                isActive: true,
              });

              setTableData((tableData) => {
                const temp = tableData.map((datum) => {
                  if (datum.id === objectId) {
                    datum.isActive = true;
                  }
                  return datum;
                });

                return temp;
              });

              return {
                status: 'unblocked',
                id: objectId,
              };
            } catch (error) {
              throw new Error(parseErrorMessage(error));
            }
          },
        });
        break;
      }
      default: {
        return;
      }
    }

    setIsModalVisible(true);
  };

  return (
    <>
      <Breadcrumb
        title={`${capitalizeWord(MODEL_NAMES.singular)} List`}
        parent={capitalizeWord(MODEL_NAMES.plural)}
      />
      <div className="container-fluid">
        <Row justify="end" gutter={{ sm: 24, md: 12, lg: 8 }}>
          <Col>
            <SearchBar
              text="Role's title"
              handleAsyncSearch={handleDataSearch}
              defaultValue={searchString}
            />
          </Col>
        </Row>
        {searchString.length === 0 ? null : (
          <Row>
            <Col span={24}>
              <h3>Search results for: </h3>
              <h3 style={{ fontWeight: 900 }}>{searchString}</h3>
            </Col>
          </Row>
        )}
        <Row>
          {/* <!-- Individual column searching (text inputs) Starts--> */}
          <Col span={24}>
            <Space>
              <Button
                className="btn btn-primary btn-lg"
                type="primary"
                onClick={handleAdd}
              >
                Add {capitalizeWord(MODEL_NAMES.singular)}
              </Button>
            </Space>

            <Divider />

            <Modal
              title={modalProperties.title}
              visible={isModalVisible}
              onOk={handleModalOk}
              onCancel={() => setIsModalVisible(false)}
              footer={
                <Button
                  type="primary"
                  loading={isModalLoading}
                  onClick={handleModalOk}
                  style={{
                    backgroundColor: modalProperties.confirmButtonColor,
                    borderColor: modalProperties.confirmButtonColor,
                  }}
                >
                  {modalProperties.confirmButtonText}
                </Button>
              }
            >
              <p>{modalProperties.text}</p>
            </Modal>

            <Row>
              <Col span={24}>
                <DataTable
                  keyField="id"
                  noHeader
                  columns={columns}
                  data={tableData}
                  progressPending={loading}
                  // pagination
                  paginationServer
                  paginationTotalRows={total}
                  onChangeRowsPerPage={handlePerRowsChange}
                  onChangePage={handlePageChange}
                  onSelectedRowsChange={handleRowsSelects}
                />
              </Col>
              <Col span={24}>
                <Card style={{ width: '100%', border: 'none' }}>
                  <Divider />
                  <TablePagination
                    type="full"
                    page={page}
                    pageLength={perPage}
                    totalRecords={total}
                    onPageChange={({ page, pageLength }) => {
                      handlePaginationChange(page, pageLength);
                    }}
                    prevPageRenderer={() => '<'}
                    nextPageRenderer={() => '>'}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
          {/* <!-- Individual column searching (text inputs) Ends--> */}
        </Row>
      </div>
    </>
  );
};

export default RoleListPage;
