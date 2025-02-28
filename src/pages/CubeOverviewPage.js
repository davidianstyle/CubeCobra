import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import CubePropType from 'proptypes/CubePropType';

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Col,
  Nav,
  Navbar,
  NavbarToggler,
  NavItem,
  NavLink,
  Row,
  UncontrolledAlert,
  UncontrolledCollapse,
} from 'reactstrap';

import { LinkExternalIcon, QuestionIcon, EyeClosedIcon } from '@primer/octicons-react';

import { csrfFetch } from 'utils/CSRF';
import { getCubeId, getCubeDescription } from 'utils/Util';

import UserContext from 'contexts/UserContext';
import BlogPost from 'components/BlogPost';
import CSRFForm from 'components/CSRFForm';
import CubeOverviewModal from 'components/CubeOverviewModal';
import CubeSettingsModal from 'components/CubeSettingsModal';
import DynamicFlash from 'components/DynamicFlash';
import FollowersModal from 'components/FollowersModal';
import TextBadge from 'components/TextBadge';
import Tooltip from 'components/Tooltip';
import Markdown from 'components/Markdown';
import withModal from 'components/WithModal';
import CubeLayout from 'layouts/CubeLayout';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import DeleteCubeModal from 'components/DeleteCubeModal';
import CustomizeBasicsModal from 'components/CustomizeBasicsModal';
import CubeIdModal from 'components/CubeIdModal';
import QRCodeModal from 'components/QRCodeModal';

const FollowersModalLink = withModal('a', FollowersModal);
const CubeSettingsModalLink = withModal(NavLink, CubeSettingsModal);
const DeleteCubeModalLink = withModal(NavLink, DeleteCubeModal);
const CustomizeBasicsModalLink = withModal(NavLink, CustomizeBasicsModal);
const CubeIdModalLink = withModal('span', CubeIdModal);
const QRCodeModalLink = withModal('a', QRCodeModal);

const PrivateCubeIcon = () => (
  <Tooltip
    text="This cube is set as private."
    wrapperTag="span"
    className="text-secondary"
    style={{ position: 'relative', top: '-3px' }}
  >
    <EyeClosedIcon size={24} />
  </Tooltip>
);

const CubeOverview = ({ post, priceOwned, pricePurchase, cube, followed, followers, loginCallback }) => {
  const user = useContext(UserContext);

  const [alerts, setAlerts] = useState([]);
  const [cubeState, setCubeState] = useState(cube);
  const [followedState, setFollowedState] = useState(followed);

  const addAlert = (color, message) => {
    setAlerts([...alerts, { color, message }]);
  };

  const onCubeUpdate = (updated) => {
    addAlert('success', 'Update Successful');
    setCubeState(updated);
  };

  const follow = () => {
    setFollowedState(true);

    csrfFetch(`/cube/follow/${cube._id}`, {
      method: 'POST',
      headers: {},
    }).then((response) => {
      if (!response.ok) {
        console.error(response);
      }
    });
  };

  const unfollow = () => {
    setFollowedState(false);

    csrfFetch(`/cube/unfollow/${cube._id}`, {
      method: 'POST',
      headers: {},
    }).then((response) => {
      if (!response.ok) {
        console.error(response);
      }
    });
  };
  return (
    <MainLayout loginCallback={loginCallback}>
      <CubeLayout cube={cubeState} activeLink="overview">
        {user && cubeState.owner === user.id ? (
          <Navbar expand="md" light className="usercontrols mb-3">
            <NavbarToggler
              className="ms-auto"
              id="cubeOverviewNavbarToggler"
              aria-controls="cubeOverviewNavbarCollapse"
            />
            <UncontrolledCollapse navbar id="cubeOverviewNavbarCollapse" toggler="#cubeOverviewNavbarToggler">
              <Nav navbar>
                <NavItem>
                  <CubeOverviewModal
                    cube={cubeState}
                    cubeID={cubeState._id}
                    onError={(message) => addAlert('danger', message)}
                    onCubeUpdate={onCubeUpdate}
                  />
                </NavItem>
                <NavItem>
                  <CubeSettingsModalLink cube={cubeState} modalProps={{ addAlert, onCubeUpdate }}>
                    Edit Settings
                  </CubeSettingsModalLink>
                </NavItem>
                <NavItem>
                  <CustomizeBasicsModalLink
                    modalProps={{
                      cube: cubeState,
                      onError: (message) => {
                        addAlert('danger', message);
                      },
                      updateBasics: (basics) => {
                        const deepClone = JSON.parse(JSON.stringify(cubeState));
                        deepClone.basics = basics;
                        onCubeUpdate(deepClone);
                      },
                    }}
                  >
                    Customize Basics
                  </CustomizeBasicsModalLink>
                </NavItem>
                <NavItem>
                  <DeleteCubeModalLink modalProps={{ cubeId: cubeState._id, cubeName: cube.name }}>
                    Delete Cube
                  </DeleteCubeModalLink>
                </NavItem>
              </Nav>
            </UncontrolledCollapse>
          </Navbar>
        ) : (
          <Row className="mb-3" />
        )}
        <DynamicFlash />
        {alerts.map(({ color, message }, index) => (
          <UncontrolledAlert color={color} key={/* eslint-disable-line react/no-array-index-key */ index}>
            {message}
          </UncontrolledAlert>
        ))}
        <Row>
          <Col md="4" className="mb-3">
            <Card>
              <CardHeader>
                <Row>
                  <Col>
                    <h3>
                      {cubeState.name} {cubeState.isPrivate && <PrivateCubeIcon />}
                    </h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <h6 className="card-subtitle mb-2" style={{ marginTop: 10 }}>
                      <FollowersModalLink href="#" modalProps={{ followers }}>
                        {cubeState.users_following.length}{' '}
                        {cubeState.users_following.length === 1 ? 'follower' : 'followers'}
                      </FollowersModalLink>
                    </h6>
                  </Col>
                  <Col xs="auto" className="ms-auto d-flex">
                    <TextBadge name="Cube ID">
                      <Tooltip text="Click to copy to clipboard">
                        <button
                          type="button"
                          className="cube-id-btn"
                          onKeyDown={() => {}}
                          onClick={(e) => {
                            navigator.clipboard.writeText(getCubeId(cubeState));
                            e.target.blur();
                            addAlert('success', 'Cube ID copied to clipboard.');
                          }}
                        >
                          {getCubeId(cubeState)}
                        </button>
                      </Tooltip>
                    </TextBadge>
                    <CubeIdModalLink
                      modalProps={{ fullID: cube._id, shortID: getCubeId(cubeState), alert: addAlert }}
                      aria-label="Show Cube IDs"
                      className="ms-1 pt-1"
                    >
                      <QuestionIcon size="18" />
                    </CubeIdModalLink>
                  </Col>
                </Row>
              </CardHeader>
              <div className="position-relative">
                <img className="card-img-top w-100" alt={cubeState.image_name} src={cubeState.image_uri} />
                <em className="cube-preview-artist">Art by {cubeState.image_artist}</em>
              </div>
              <CardBody className="pt-2 px-3 pb-3">
                {cube.type && <p className="mb-1">{getCubeDescription(cubeState)}</p>}
                <h6 className="mb-2">
                  <i>
                    Designed by
                    <a href={`/user/view/${cubeState.owner}`}> {cubeState.owner_name}</a>
                  </i>{' '}
                  • <a href={`/cube/rss/${cubeState._id}`}>RSS</a> •{' '}
                  <QRCodeModalLink
                    href="#"
                    modalProps={{ link: `https://cubecobra.com/c/${cube._id}`, cubeName: cube.name }}
                  >
                    QR Code
                  </QRCodeModalLink>
                </h6>
                <p>
                  <a href={`https://luckypaper.co/resources/cube-map/?cube=${cubeState._id}`}>
                    View in Cube Map <LinkExternalIcon size={16} />
                  </a>
                </p>
                {!cubeState.privatePrices && (
                  <Row className="mb-1 g-0">
                    {Number.isFinite(priceOwned) && (
                      <TextBadge name="Owned" className="me-2">
                        <Tooltip text="TCGPlayer Market Price as owned (excluding cards marked Not Owned)">
                          ${Math.round(priceOwned).toLocaleString()}
                        </Tooltip>
                      </TextBadge>
                    )}
                    {Number.isFinite(pricePurchase) && (
                      <TextBadge name="Buy">
                        <Tooltip text="TCGPlayer Market Price for cheapest version of each card">
                          ${Math.round(pricePurchase).toLocaleString()}
                        </Tooltip>
                      </TextBadge>
                    )}
                  </Row>
                )}
                {user && user.roles.includes('Admin') && (
                  <CSRFForm
                    method="POST"
                    id="featuredForm"
                    action={`/cube/${cubeState.isFeatured ? 'unfeature/' : 'feature/'}${cubeState._id}`}
                    className="mt-2"
                  >
                    <Button color="accent" type="submit" disabled={!cubeState.isFeatured && cubeState.isPrivate}>
                      {' '}
                      {cubeState.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                    </Button>
                  </CSRFForm>
                )}
              </CardBody>
              {user &&
                cubeState.owner !== user.id &&
                (followedState ? (
                  <Button outline color="unsafe" className="rounded-0" onClick={unfollow}>
                    Unfollow
                  </Button>
                ) : (
                  <Button color="accent" className="rounded-0" onClick={follow}>
                    Follow
                  </Button>
                ))}
            </Card>
          </Col>
          <Col>
            <Card>
              <CardHeader>
                <h5 className="card-title">Description</h5>
              </CardHeader>
              <CardBody>
                <Markdown markdown={cubeState.description || ''} />
              </CardBody>
              {cubeState.tags && cubeState.tags.length > 0 && (
                <CardFooter>
                  <div className="autocard-tags">
                    {cubeState.tags.map((tag) => (
                      <a href={`/search/tag:"${tag}"/0`}>
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      </a>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
          </Col>
        </Row>
        <div className="mb-3">{post && <BlogPost key={post._id} post={post} />}</div>
      </CubeLayout>
    </MainLayout>
  );
};

CubeOverview.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }),
  priceOwned: PropTypes.number,
  pricePurchase: PropTypes.number,
  cube: CubePropType.isRequired,
  followed: PropTypes.bool.isRequired,
  followers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
  ),
  loginCallback: PropTypes.string,
};

CubeOverview.defaultProps = {
  post: null,
  priceOwned: null,
  pricePurchase: null,
  followers: [],
  loginCallback: '/',
};

export default RenderToRoot(CubeOverview);
