import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import {
  faHouse,
  faSquarePlus,
  faTableCells,
  faRightFromBracket,
  faMagnifyingGlass,
  faPlay,
  faEye,
  faTrash,
  faPen,
  faUpload,
  faHeart as faHeartSolid,
  faArrowsRotate,
  faComment,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

export const HomeIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faHouse} className={className} />
)

export const PlusSquareIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faSquarePlus} className={className} />
)

export const LayoutGridIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faTableCells} className={className} />
)

export const LogOutIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faRightFromBracket} className={className} />
)

export const SearchIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faMagnifyingGlass} className={className} />
)

export const PlayIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faPlay} className={className} />
)

export const HeartIcon = ({ className, fill }: { className?: string, fill?: boolean }) => (
  <FontAwesomeIcon icon={fill ? faHeartSolid : faHeartRegular} className={className} />
)

export const EyeIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faEye} className={className} />
)

export const TrashIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faTrash} className={className} />
)

export const EditIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faPen} className={className} />
)

export const UploadIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faUpload} className={className} />
)

export const RefreshIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faArrowsRotate} className={className} />
)

export const CommentIcon = ({ className }: { className?: string }) => (
  <FontAwesomeIcon icon={faComment} className={className} />
)
